class NetworkController {
    constructor(url, tabsController) {
        this.webSocket = new WebSocket(url)
        this.tabsController = tabsController
        const _this = this

        const isExistingToNewSwitch = document.getElementById('isExistingToNew')
        this.isExistingToNew = () => isExistingToNewSwitch.checked

        const isNewWillBeSelectedSwitch = document.getElementById('isNewWillBeSelected')
        this.isNewWillBeSelected = () => isNewWillBeSelectedSwitch.checked

        this.webSocket.onopen = function () {
            console.log("Connected to WS!");
            document.getElementById("connectBtn").style.backgroundColor = "green"
            document.getElementById("connectBtn").title = "Connect (Connected)"
        }

        this.webSocket.onmessage = function (event) {
            const msg = JSON.parse(event.data);
            _this.handleMessage(msg)
        }

        this.webSocket.onclose = function (event) {
            console.log("WS closed!")
            document.getElementById("connectBtn").style.backgroundColor = "red"
            document.getElementById("connectBtn").title = "Connect (Disconnected)"
        }
    }

    handleMessage(msg) {
        if (msg.type == MSG_ADD_NODE_AND_EDGE) {
            this.tabsController.onCurrent((_, controller) => {
                const selectedNode = controller.selectedNode

                const nodeId = this.addNodeAndEdge(controller, selectedNode, msg.node, msg.edge, this.isExistingToNew(), true)
                if (this.isNewWillBeSelected())
                    controller.selectNode(nodeId, true)
            })
        } else if (msg.type == MSG_ADD_NODES_AND_EDGES) {
            let isExistingToNew = this.isExistingToNew()
            if (msg.hasOwnProperty('direction')) {
                isExistingToNew = msg.direction == 'e2n'
            }

            this.tabsController.onCurrent((_, controller) => {
                const selectedNode = controller.selectedNode

                controller.addUndoMarker()

                for (const node of msg.nodes) {
                    this.addNodeAndEdge(controller, selectedNode, node, msg.edge, isExistingToNew, false, false)
                }
                controller.draw()
            })


        } else if (msg.type == MSG_UPDATE_NODES) {
            // I assume all the opened tabs are from the same app, otherwise...
            for (const { tabController } of this.tabsController.tabs) {
                tabController.updateNodes(msg.selection, msg.update, msg.version || 1)
            }
        }
    }

    addNodeAndEdge(controller, selectedNode, msgNode, msgEdge, isExistingToNew, shouldAddUndo, shouldDraw=true) {
        // 1. If msgEdge forces isExistingToNew, replace
        isExistingToNew = (msgEdge != null && 'isExistingToNew' in msgEdge) ? msgEdge.isExistingToNew : isExistingToNew
        // 2. Check if dest node exists
        const existingDestNode = 'address' in msgNode ? controller.queryNode('address', msgNode.address) : null
        if (existingDestNode != null) {
            // 3. Check if needs to add edge to the existing node
            if (selectedNode != null) {
                if (shouldAddUndo) controller.addUndoMarker()
                controller.addEdge({ ...createFromTo(selectedNode.id, existingDestNode.id, isExistingToNew), ...(msgEdge || {}) }, null, shouldDraw)
            }
            // return new node
            return existingDestNode.id
        } else {
            if (shouldAddUndo) controller.addUndoMarker()
            // 2. create a new node
            const newNode = controller.addNode(msgNode, shouldDraw)
            // 3. add new edge
            if (selectedNode != null) {
                controller.addEdge({ ...createFromTo(selectedNode.id, newNode.id, isExistingToNew), ...(msgEdge || {}) }, null, shouldDraw)
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