
const ADD_EDGE = "addEdge"
const ADD_NODE = "addNode"
const REMOVE_EDGE = "removeEdge"
const REMOVE_NODE = "removeNode"
const MARKER = "marker"

const MSG_ADD_NODE_AND_EDGE = "addData"
const MSG_UPDATE_NODES = "updateNodes"

const HISTORY_MARKER = { type: MARKER, data: {} }

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
                    } catch (e) {
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

    addUndoMarker() {
        this.undoHistory.push(HISTORY_MARKER)
    }

    undo() {
        console.log("Undo")
        console.log("\t", "undo:", [...this.undoHistory], "redo:", [...this.redoHistory])
        if (this.undoHistory.length) {
            this.redoHistory.push(HISTORY_MARKER)
            while (this.undoHistory.length) {
                const historyEntry = this.undoHistory.pop()
                const { type, data } = historyEntry
                if (type == MARKER) {
                    break
                } else if (type == ADD_NODE) {
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

            this.network.redraw()
        }
        console.log("---->", "undo:", [...this.undoHistory], "redo:", [...this.redoHistory])
    }

    redo() {
        if (this.redoHistory.length) {
            this.undoHistory.push(HISTORY_MARKER)
            while (this.redoHistory.length) {
                const historyEntry = this.redoHistory.pop()
                const { type, data } = historyEntry
                if (type == MARKER) {
                    break
                } else if (type == ADD_NODE) {
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

            this.network.redraw()
        }
    }

    updateNodes(selection, updateObj) {
        const updates = this.nodes.get({
            filter: item => {
                const extra = item.extra
                for (const [key, value] of selection) {
                    if (!(key in extra)) return false;
                    if (extra[key] != value) return false;
                }
                return true;
            }

        }).map(item => mergeToVisNode(item, updateObj))
        this.nodes.updateOnly(updates)

        const updateUndoItem = item => {
            if (item.type != ADD_NODE && item.type != REMOVE_NODE)
                return item

            const extra = item.data.extra
                for (const [key, value] of selection) {
                    if (!(key in extra)) return item;
                    if (extra[key] != value) return item;
                }
            return ({ type: item.type, data: mergeToVisNode(item.data, updateObj) })
        }

        this.undoHistory = this.undoHistory.map(updateUndoItem)
        this.redoHistory = this.redoHistory.map(updateUndoItem)


        this.network.redraw()
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

            if (msg.type == MSG_ADD_NODE_AND_EDGE) {
                // 1. Find the selected node
                const selectedNode = graphController.selectedNode
                // 2. Check if dest node exists
                const existingDestNode = 'address' in msg.node ? graphController.queryNode('address', msg.node.address) : null
                if (existingDestNode != null) {
                    // 3. Check if needs to add edge to the existing node
                    if (selectedNode != null) {
                        graphController.addUndoMarker()
                        graphController.addEdge({ from: selectedNode.id, to: existingDestNode.id, ...(msg.edge || {}) })
                    }
                     // 4. selected existing node
                     graphController.selectNode(existingDestNode.id)
                } else {
                    graphController.addUndoMarker()
                    // 2. create a new node
                    const newNode = graphController.addNode(msg.node, msg.design)
                    // 3. add new edge
                    if (selectedNode != null)
                        graphController.addEdge({ from: selectedNode.id, to: newNode.id, ...(msg.edge || {}) })
                    // 4. selected added node
                    graphController.selectNode(newNode.id)
                }
            } else if (msg.type == MSG_UPDATE_NODES) {
                graphController.updateNodes(msg.selection, msg.update)
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
    try {
        navigator.clipboard.writeText(s).then(function () {
            console.log('Copied to clipboard');
        }, function (err) {
            console.log(s)
        });
    } catch(err) {
        console.log(s)
    }

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
        for (const { name, format, replacements } of node[NODE_COMPUTED_PROPERTIES]) {
            const realReplacements = replacements.map(fieldName => node[fieldName])
            node[name] = formatString(format, realReplacements)
        }
    }
}

function mergeToVisNode(visNode, updateObj) {
    const newNodeExtra = { ...visNode.extra, ...updateObj }
    updateNodeProperties(newNodeExtra)
    return { ...visNode, id: visNode.id, label: newNodeExtra.label, extra: newNodeExtra }
}

function formatString(s, replacements) {
    let str = s;
    if (replacements.length) {
        for (const key in replacements) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), replacements[key]);
        }
    }
    return str;
}


function main() {
    const savedData = restore()
    const [id, nodes, edges] = savedData || [1, [], []]
    const graphController = new GraphController(nodes, edges, document.getElementById("mynetwork"), id)

    // for debugging
    window.graphController = graphController
}

main()