
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
        this.undoHistory = []
        this.redoHistory = []
        this.idCounter = currentId
        this.selectedNode = null
        this.container = container

        const _this = this
        container.addEventListener('click', (element) => {
            _this.selectNode(null)
        })

        mermaid.initialize({
            securityLevel: 'loose',
            theme: 'forest',
            useMaxWidth: true
        });

        this.zoom = panzoom(this.container, {
            smoothScroll: false
        })
        this.draw()
    }

    resetScrolling() {
        this.zoom.moveTo(0, 0)
        this.zoom.zoomAbs(0, 0, 1)
    }

    import(nodes, edges, currentId) {
        this.reset()
        this.nodes = new vis.DataSet(nodes)
        this.edges = new vis.DataSet(edges)
        this.idCounter = currentId
        this.draw()
    }

    toMermaid(gui = false) {
        const [_, nodes, edges] = this.export()

        if (nodes.length == 0) {
            return ""
        }

        // to support older clients, we switch from flowchart to graph for export
        let s = gui ? "flowchart TD\n" : "graph TD\n"

        for (const node of nodes) {
            s += `  N${node.id}["${escapeHtml(node.label, gui)}"]\n`
        }
        s += "\n\n"
        for (const edge of edges) {
            if ('label' in edge) {
                s += `N${edge.from}-->|"${escapeHtml(edge.label, gui)}"|N${edge.to}\n`
            } else {
                s += `N${edge.from} --> N${edge.to}\n`
            }
        }

        if (gui) {
            s += "\n\n"
            if (this.selectedNode != null) {
                s += `style N${this.selectedNode.id} fill:#b9b9ff,stroke:#333,stroke-width:4px`
            }
        }
        return s
    }

    onClick(target, elementId) {
        this.selectNode(elementId)
    }

    onRightClick(target, elementId) {
        const node = this.nodes.get(elementId)
        if ('address' in node.extra && 'networkController' in window) {
            try {
                networkController.send(node.extra.address)
            } catch (e) {
                console.log(e)
            }
        }
    }

    draw() {
        setTimeout(save, 0)
        
        const _this = this

        const data = this.toMermaid(true)
        if (data.length == 0) {
            this.container.textContent = "empty graph"
            return
        }

        this.container.textContent = data
        this.container.removeAttribute('data-processed');

        const insertSvg = function (svgCode, bindFunctions) {
            _this.container.innerHTML = svgCode;
        };
        mermaid.render('mermaid_stuff', data, insertSvg);
        this.container.style.width = this.container.getElementsByTagName("svg")[0].style.maxWidth

        // hacks to add listeners
        setTimeout(function () {
            const nodesArray = [...document.querySelectorAll('.node')]
            for (const node of nodesArray) {
                // fix pointer
                node.classList.add("clickable")
                // add click event
                if (!node.hasAttribute("has_listeners")) {
                    node.setAttribute("has_listeners", "true")
                    node.addEventListener('click', (event) => {
                        _this.onClick(event.currentTarget, parseInt(event.currentTarget.id.split('-')[1].substring(1)))
                        event.preventDefault()
                        event.stopPropagation()
                    })
                    // add right click event
                    node.addEventListener('contextmenu', (event) => {
                        _this.onRightClick(event.currentTarget, parseInt(event.currentTarget.id.split('-')[1].substring(1)))
                        event.preventDefault()
                        event.stopPropagation()
                    })
                }
            }
        }, 0)
    }

    export() {
        return [this.idCounter, this.nodes.get(), this.edges.get()]
    }

    reset(shouldSupportUndo = false) {
        if (shouldSupportUndo) {
            // Add all node and edges to undo
            this.addUndoMarker()
            this.undoHistory.push(...this.nodes.map((node) => ({type: REMOVE_NODE, data: {...node}})))
            this.undoHistory.push(...this.edges.map((edge) => ({type: REMOVE_EDGE, data: {...edge}})))
        } else {
            this.undoHistory = []
        }

        this.redoHistory = []
        this.edges.clear()
        this.nodes.clear()

        this.selectedNode = null

        this.draw()
    }

    addNode(node, design = null) {
        updateNodeProperties(node)

        // TODO make design customizable
        const _design = design || {}
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

        this.draw()

        return visNode
    }

    addEdge(edge, design = null) {
        updateNodeProperties(edge)

        // TODO make design customizable
        const _design = design || {}

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

        this.draw()

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
        if (id == null) {
            this.selectedNode = null
        } else {
            this.selectedNode = this.nodes.get(id)
        }
        this.draw()
    }

    addUndoMarker() {
        this.undoHistory.push(HISTORY_MARKER)
    }

    undo() {
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

            if (this.selectedNode != null && this.nodes.get(this.selectedNode.id) == null) {
                this.selectedNode = null
            }

            this.draw()
        }
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

            if (this.selectedNode != null && this.nodes.get(this.selectedNode.id) == null) {
                this.selectedNode = null
            }

            this.draw()
        }
    }

    deleteCurrentNode() {
        if (this.selectedNode) {
            const removedNode = this.selectedNode
            const removedNodeId = removedNode.id
            // Start undo session
            this.addUndoMarker()
            // Remove the node
            this.nodes.remove(removedNode.id)
            // Update undo history for node
            this.undoHistory.push({ type: REMOVE_NODE, data: { ...removedNode } })
            // Get all edges containing the node
            const removedEdges = this.edges.get({filter: (edge) => edge.from == removedNodeId || 
                                                                   edge.to == removedNodeId })
            console.log(removedEdges)
            // Remove them, and update undo history
            for (const removedEdge of removedEdges) {
                this.edges.remove(removedEdge.id)
                this.undoHistory.push({ type: REMOVE_EDGE, data: { ...removedEdge } })
            }

            // update history
            this.redoHistory = []

            // remember to clear selected node
            this.selectedNode = null

            this.draw()
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


        this.draw()
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
            document.getElementById("connectBtn").style.backgroundColor = "green"
        }

        this.webSocket.onmessage = function (event) {
            const msg = JSON.parse(event.data);
            console.log("Received:", msg)

            if (msg.type == MSG_ADD_NODE_AND_EDGE) {
                const isNodeTarget = 'isNodeTarget' in msg ? msg.isNodeTarget : true

                // 1. Find the selected node
                const selectedNode = graphController.selectedNode
                // 2. Check if dest node exists
                const existingDestNode = 'address' in msg.node ? graphController.queryNode('address', msg.node.address) : null
                if (existingDestNode != null) {
                    // 3. Check if needs to add edge to the existing node
                    if (selectedNode != null) {
                        graphController.addUndoMarker()
                        graphController.addEdge({ ...createFromTo(selectedNode.id, existingDestNode.id, isNodeTarget), ...(msg.edge || {}) })
                    }
                    // 4. selected existing node
                    graphController.selectNode(existingDestNode.id)
                } else {
                    graphController.addUndoMarker()
                    // 2. create a new node
                    const newNode = graphController.addNode(msg.node, msg.design)
                    // 3. add new edge
                    if (selectedNode != null) {
                        graphController.addEdge({ ...createFromTo(selectedNode.id, newNode.id, isNodeTarget), ...(msg.edge || {}) })
                    }
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
            document.getElementById("connectBtn").style.backgroundColor = "red"
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
    graphController.reset(shouldSupportUndo=true)
}


function event_undo() {
    graphController.undo()
}

function event_redo() {
    graphController.redo()
}

function event_delete() {
    graphController.deleteCurrentNode()
}

function event_mermaid() {
    const s = graphController.toMermaid()

    try {
        navigator.clipboard.writeText(s).then(function () {
            console.log('Copied to clipboard');
        }, function (err) {
            console.log(s)
        });
    } catch (err) {
        console.log(s)
    }
}

function event_center() {
    graphController.resetScrolling()
}

function event_export() {
    const blob = new Blob([JSON.stringify(graphController.export())])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'graffiti_export.json'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
}

function event_import() {
    readFile = function(e) {
		var file = e.target.files[0]
		if (!file) {
			return
		}
		const reader = new FileReader()
		reader.onload = function(e) {
			const contents = e.target.result
            const [id, nodes, edges] = JSON.parse(contents)
            graphController.import(nodes, edges, id)
		}
		reader.readAsText(file)
	}

    const fileInput = document.createElement("input")
	fileInput.type='file'
	fileInput.style.display='none'
	fileInput.onchange=readFile
	document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
}

function save() {
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

function createFromTo(currentNode, newNode, isNodeTarget) {
    if (isNodeTarget)
        return { from: currentNode, to: newNode }
    else
        return { from: newNode, to: currentNode }
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

function escapeHtml(unsafe, gui) {
    const res = unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    return gui ? res : res.replace('\n', '')
}

function main() {
    const savedData = restore()
    const [id, nodes, edges] = savedData || [1, [], []]
    const graphController = new GraphController(nodes, edges, document.getElementById("graph"), id)

    window.graphController = graphController

    window.onbeforeunload = function() {
        if (false) {
            return "You haven't saved your changes.";
        }
    };
}

main()
