class NetworkController {
    constructor(url, tabsController) {
        this.webSocket = new WebSocket(url)
        const _this = this

        const ws = this.webSocket

        const isExistingToNewSwitch = document.getElementById('isExistingToNew')
        const isExistingToNew = () => isExistingToNewSwitch.checked

        const isNewWillBeSelectedSwitch = document.getElementById('isNewWillBeSelected')
        const isNewWillBeSelected = () => isNewWillBeSelectedSwitch.checked

        this.webSocket.onopen = function () {
            console.log("Connected to WS!");
            document.getElementById("connectBtn").style.backgroundColor = "green"
        }

        this.webSocket.onmessage = function (event) {
            const msg = JSON.parse(event.data);
            

            if (msg.type == MSG_ADD_NODE_AND_EDGE) {
                tabsController.onCurrent((_, controller) => {
                    const selectedNode = controller.selectedNode

                    const nodeId = _this.addNodeAndEdge(controller, selectedNode, msg.node, msg.design, msg.edge, isExistingToNew(), true)
                    if (isNewWillBeSelected())
                        controller.selectNode(nodeId)
                })
            } else if (msg.type == MSG_ADD_NODES_AND_EDGES) {
                tabsController.onCurrent((_, controller) => {
                    const selectedNode = controller.selectedNode

                    controller.addUndoMarker()

                    for (const node of msg.nodes) {
                        _this.addNodeAndEdge(controller, selectedNode, node, msg.design, msg.edge, isExistingToNew(), false)
                    }
                })


            } else if (msg.type == MSG_UPDATE_NODES) {
                // I assume all the opened tabs are from the same app, otherwise...
                for (const { tabController } of tabsController.tabs) {
                    tabController.updateNodes(msg.selection, msg.update)
                }
            }
        }

        this.webSocket.onclose = function (event) {
            console.log("WS closed!")
            document.getElementById("connectBtn").style.backgroundColor = "red"
        }
    }

    addNodeAndEdge(controller, selectedNode, msgNode, msgDesign, msgEdge, isExistingToNew, shouldAddUndo) {
        // 2. Check if dest node exists
        const existingDestNode = 'address' in msgNode ? controller.queryNode('address', msgNode.address) : null
        if (existingDestNode != null) {
            // 3. Check if needs to add edge to the existing node
            if (selectedNode != null) {
                if (shouldAddUndo) controller.addUndoMarker()
                controller.addEdge({ ...createFromTo(selectedNode.id, existingDestNode.id, isExistingToNew), ...(msgEdge || {}) })
            }
            // return new node
            return existingDestNode.id
        } else {
            if (shouldAddUndo) controller.addUndoMarker()
            // 2. create a new node
            const newNode = controller.addNode(msgNode, msgDesign)
            // 3. add new edge
            if (selectedNode != null) {
                controller.addEdge({ ...createFromTo(selectedNode.id, newNode.id, isExistingToNew), ...(msgEdge || {}) })
            }
            // 4. selected added node
            return newNode.id
        }
    }

    send(data) {
        this.webSocket.send(data)
    }

    close() {
        this.webSocket.close()
    }
}