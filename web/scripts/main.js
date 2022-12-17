const MSG_ADD_NODE_AND_EDGE = "addData"
const MSG_UPDATE_NODES = "updateNodes"



function event_connect() {
    const url = document.getElementById("socketUrl").value

    // close global network controller
    if (window.networkController)
        window.networkController.close()

    window.networkController = new NetworkController(url, window.tabsController)
}

function event_reset() {
    window.tabsController.onCurrent((_, controller) => {
        controller.reset(shouldSupportUndo = true)
    })
}


function event_undo() {
    window.tabsController.onCurrent((_, controller) => {
        controller.undo()
    })
}

function event_redo() {
    window.tabsController.onCurrent((_, controller) => {
        controller.redo()
    })
}

function event_delete() {
    window.tabsController.onCurrent((_, controller) => {
        controller.deleteCurrentNode()
    })

}

function event_mermaid() {
    window.tabsController.onCurrent((_, controller) => {
        const s = controller.toMermaid()

        try {
            navigator.clipboard.writeText(s).then(function () {
                console.log('Copied to clipboard');
            }, function (err) {
                console.log(s)
            });
        } catch (err) {
            console.log(s)
        }
    })

}

function event_center() {
    window.tabsController.onCurrent((_, controller) => {
        controller.resetScrolling()
    })
}

function event_export() {
    tabsController.onCurrent((name, controller) => {
        const blob = new Blob([controller.export()])
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = name + '.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    })
}

function event_import() {
    readFile = function (e) {
        var file = e.target.files[0]
        if (!file) {
            return
        }
        const reader = new FileReader()
        reader.onload = function (e) {
            // Create new tab with the filename as name
            const contents = e.target.result
            let name = file.name
            if (name.endsWith(".json")) {
                name = name.substring(0, name.length - 5);
            }

            const tabsController = window.tabsController

            // If we have only empty untitled tab, remove it
            if (tabsController.count() == 1 && tabsController.tabs[0].name == "untitled" &&
                tabsController.tabs[0].tabController.nodes.length == 0) {
                tabsController.removeTab(0)
            }


            const addedTab = tabsController.addTab(name)
            tabsController.selectTab(addedTab)
            tabsController.onCurrent((_, controller) => {
                controller.import(contents)
            })

        }
        reader.readAsText(file)
    }

    const fileInput = document.createElement("input")
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
}

function event_addTab() {
    const tabName = prompt("What is the new graph name?")
    if (tabName) {
        const tab = window.tabsController.addTab(tabName)
        window.tabsController.selectTab(tab)
    }
}



function main() {
    initiateDependencies();
    initiateHotkeys();

    // Initiate tabs
    const tabsController = new TabsController(document.getElementsByClassName("tabs")[0], document.getElementsByClassName("view")[0], document.getElementById("context-menu"));
    tabsController.restore()

    window.tabsController = tabsController
}

function initiateDependencies() {
    // Initiate mermaid
    mermaid.initialize({
        securityLevel: 'loose',
        theme: 'forest',
        useMaxWidth: true
    });
}

function initiateHotkeys() {
    hotkeys('ctrl+z,ctrl+shift+z,ctrl+y,ctrl+s,delete,home', function (event, handler) {
        switch (handler.key) {
            case 'ctrl+z':
                event_undo();
                return false;
            case 'ctrl+shift+z':
            case 'ctrl+y':
                event_redo();
                return false;
            case 'ctrl+s':
                event_export();
                return false;
            case 'delete':
                event_delete();
                return false;
            case 'home':
                event_center();
                return false;
        }
    });

}



main()
