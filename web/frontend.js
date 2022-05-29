
const ADD_EDGE = "addEdge"
const ADD_NODE = "addNode"
const REMOVE_EDGE = "removeEdge"
const REMOVE_NODE = "removeNode"

const MSG_ADD_NODE_AND_EDGE = "addData"

class GraphController {
    constructor(nodes, edges, container, currentId = 1) {
        this.nodes = new vis.DataSet(nodes)
        this.edges = new vis.DataSet(edges)
        this.network = new vis.Network(container, { nodes: this.nodes, edges: this.edges }, {
            layout: {
                hierarchical: {
                    direction: "UD",
                    sortMethod: "directed",
                },
            },
            physics: {
                hierarchicalRepulsion: {
                  avoidOverlap: 0.2,
                },
              },
        });
        this.undoHistory = []
        this.redoHistory = []
        this.idCounter = currentId
        this.selectedNode = null

        const _this = this
        this.network.on('select', function (p) {
            const selected = p.nodes
            if (selected.length == 0) {
                _this.selectedNode = null
            } else {
                _this.selectedNode = _this.nodes.get(selected[0])
            }
        });
        
        this.network.on("oncontext", function (p) {
            p.event.preventDefault();
           
            if (p.nodes.length == 1) {
                const node = _this.nodes.get(p.nodes[0])
                if ('address' in node.extra && 'networkController' in window) {
                    try {
                    networkController.send(node.extra.address)
                    } catch(e) {
                        console.log(e)
                    }
                }
            }
        });
        

    }

    export() {
        return [this.idCounter, this.nodes.get(), this.edges.get()]
    }

    reset() {
        this.edges.clear()
        this.nodes.clear()
    }

    addNode(node, design = null) {
        updateNodeProperties(node)

        // TODO make design customizable
        const _design = design || {
            size: 150,
            color: "#FFCFCF",
            shape: "box",
            font: { face: "monospace", align: "center" }
        }
        // create the vis node
        const visNode = {
            id: this.idCounter++,
            label: node.label,
            extra: node,
            ..._design
        }

        // add to the network
        this.nodes.add(visNode)

        // update history
        this.redoHistory = []
        this.undoHistory.push({ type: ADD_NODE, data: { ...visNode } })

        return visNode
    }

    addEdge(edge, design = null) {
        updateNodeProperties(edge)

        // TODO make design customizable
        const _design = design || {
            arrows: "to",
            physics: false,
            smooth: { type: "cubicBezier" }
        }

        // create the vis edge
        const visEdge = {
            id: this.idCounter++,
            from: edge.from,
            to: edge.to,
            ..._design
        }

        if ('label' in edge) {
            visEdge.label = edge.label
        }

        // add to the network
        this.edges.add(visEdge)

        // update history
        this.redoHistory = []
        this.undoHistory.push({ type: ADD_EDGE, data: { ...visEdge } })

        return visEdge
    }

    queryNode(propertyName, propertyValue) {
        const result = this.nodes.get({
            filter: function (item) {
                return item.extra[propertyName] == propertyValue;
            }
        });
        if (result.length == 1) {
            return result[0]
        }
        return null;
    }

    selectNode(id) {
        this.network.selectNodes([id])
        this.selectedNode = this.nodes.get(id)
    }

    undo() {
        if (this.undoHistory.length) {
            const historyEntry = this.undoHistory.pop()
            const { type, data } = historyEntry
            if (type == ADD_NODE) {
                this.nodes.remove(data.id)
            } else if (type == ADD_EDGE) {
                this.edges.remove(data.id)
            } else if (type == REMOVE_NODE) {
                this.nodes.add(data)
            } else if (type == REMOVE_EDGE) {
                this.edges.add(data)
            }
            this.redoHistory.push(historyEntry)
        }
    }

    redo() {
        if (this.redoHistory.length) {
            const historyEntry = this.redoHistory.pop()
            const { type, data } = historyEntry
            if (type == ADD_NODE) {
                this.nodes.add(data)
            } else if (type == ADD_EDGE) {
                this.edges.add(data)
            } else if (type == REMOVE_NODE) {
                this.nodes.remove(data.id)
            } else if (type == REMOVE_EDGE) {
                this.edges.remove(data.id)
            }
            this.undoHistory.push(historyEntry)
        }
    }

    stabilize() {
        this.network.stabilize()
    }
}

class NetworkController {
    constructor(url, graphController) {
        this.webSocket = new WebSocket(url)
        this.graphController = graphController

        const ws = this.webSocket
        this.webSocket.onopen = function () {
            console.log("Connected to WS!");
            // for some reason this is required, idk lol
            ws.send("MAGIC")
            document.getElementById("connectBtn").style.color = "green"
        }

        this.webSocket.onmessage = function (event) {
            const msg = JSON.parse(event.data);
            console.log("Received:", msg)

            // TODO currently the only support message type is add node+edge
            if (msg.type == MSG_ADD_NODE_AND_EDGE) {
                // 1. find the selected node
                const selectedNode = graphController.selectedNode
                // 2. create a new node
                const newNode = graphController.addNode(msg.node, msg.design)
                // 3. add new edge
                if (selectedNode != null)
                    graphController.addEdge({ from: selectedNode.id, to: newNode.id, ...(msg.edge || {}) })
                // 4. selected added node
                graphController.selectNode(newNode.id)

            }
            ws.send("MAGIC")
        }

        this.webSocket.onclose = function (event) {
            console.log("WS closed!")
            document.getElementById("connectBtn").style.color = "red"
        }
    }

    send(data) {
        this.webSocket.send(data)
    }

    close() {
        this.webSocket.close()
    }
}


function main() {
    const savedData = restore()
    const [id, nodes, edges] = savedData || [1, [], []]
    const graphController = new GraphController(nodes, edges, document.getElementById("mynetwork"), id)

    // for debugging
    window.graphController = graphController
}


function event_connect() {
    const url = document.getElementById("socketUrl").value

    // close global network controller
    if (window.networkController)
        window.networkController.close()
        
    window.networkController = new NetworkController(url, graphController)
}

function event_reset() {
    graphController.reset()
}

function event_save() {
    save(graphController)
}

function event_undo() {
    graphController.undo()
    graphController.undo()
}

function event_redo() {
    graphController.redo()
    graphController.redo()
}

function event_stabilize() {
    graphController.stabilize()
}

function event_mermaid() {
    let s = "flowchart TD\n"
    const [_, nodes, edges] = graphController.export()
    for (const node of nodes) {
        s += `  N${node.id}[${JSON.stringify(node.label)}]\n`
    }
    s += "\n\n"
    for (const edge of edges) {
        if ('label' in edge) {
            s += `N${edge.from}-->|${edge.label}|N${edge.to}\n`
        } else {
            s += `N${edge.from} --> N${edge.to}\n`
        }
    }

    navigator.clipboard.writeText(s).then(function () {
        console.log('Copied to clipboard');
    }, function (err) {
        console.log(s)
    });

}


function save(graphController) {
    const data = JSON.stringify(graphController.export())
    localStorage.setItem("__SAVED_DATA", data)
}

function restore() {
    return JSON.parse(localStorage.getItem("__SAVED_DATA"))
}

const NODE_COMPUTED_PROPERTIES = "computedProperties"

/** Compute the computed properties, and update the given node */
function updateNodeProperties(node) {
    if (NODE_COMPUTED_PROPERTIES in node) {
        for (const { name, format, replacements } in NODE_COMPUTED_PROPERTIES) {
            const realReplacements = replacements.map(fieldName => node[fieldName])
            node[name] = formatString(format, realReplacements)
        }
    }
}

function formatString(s, replacements) {
    let str = s;
    if (replacements.length) {
        for (const key in replacements) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
}

main()