class NetworkController {
    constructor(url, tabsController) {
        this.webSocket = new WebSocket(url)

        const ws = this.webSocket
        this.webSocket.onopen = function () {
            console.log("Connected to WS!");
            // for some reason this is required, idk lol
            ws.send("MAGIC")
            document.getElementById("connectBtn").style.backgroundColor = "green"
        }

        this.webSocket.onmessage = function (event) {
            const msg = JSON.parse(event.data);

            if (msg.type == MSG_ADD_NODE_AND_EDGE) {
                tabsController.onCurrent((_, controller) => {
                    const isNodeTarget = 'isNodeTarget' in msg ? msg.isNodeTarget : true

                    // 1. Find the selected node
                    const selectedNode = controller.selectedNode
                    // 2. Check if dest node exists
                    const existingDestNode = 'address' in msg.node ? controller.queryNode('address', msg.node.address) : null
                    if (existingDestNode != null) {
                        // 3. Check if needs to add edge to the existing node
                        if (selectedNode != null) {
                            controller.addUndoMarker()
                            controller.addEdge({ ...createFromTo(selectedNode.id, existingDestNode.id, isNodeTarget), ...(msg.edge || {}) })
                        }
                        // 4. selected existing node
                        controller.selectNode(existingDestNode.id)
                    } else {
                        controller.addUndoMarker()
                        // 2. create a new node
                        const newNode = controller.addNode(msg.node, msg.design)
                        // 3. add new edge
                        if (selectedNode != null) {
                            controller.addEdge({ ...createFromTo(selectedNode.id, newNode.id, isNodeTarget), ...(msg.edge || {}) })
                        }
                        // 4. selected added node
                        controller.selectNode(newNode.id)
                    }
                })
            } else if (msg.type == MSG_UPDATE_NODES) {
                // I assume all the opened tabs are from the same app, otherwise...
                for (const { tabController } of tabsController.tabs) {
                    tabController.updateNodes(msg.selection, msg.update)
                }
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