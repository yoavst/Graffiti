const MSG_ADD_NODE_AND_EDGE = "addData"
const MSG_ADD_NODES_AND_EDGES = "addDataBulk"
const MSG_UPDATE_NODES = "updateNodes"



function event_connect() {
    const url = document.getElementById("socketUrl").value

    // close global network controller
    if (window.networkController)
        window.networkController.close()

    window.networkController = new NetworkController(url, window.tabsController)
}

function event_reset() {
    Swal.fire({
        title: 'Reset',
        text: 'Do you want to clear the current tab?',
        showCancelButton: true
        }).then(({value=null}) => {
            if (value) {
                window.tabsController.onCurrent((_, controller) => {
                    controller.reset(shouldSupportUndo = true)
                })
            }
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
        for (const file of e.target.files) {
            event_import_onFile(file)
        }
    }

    const fileInput = document.createElement("input")
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
}

function event_import_onFile(file) {
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

function event_addTab() {
    Swal.fire({
        title: 'Add graph',
        input: 'text',
        inputValue: '',
        showCancelButton: true
      }).then(({value=null}) => {
            if (value != null && value != '') {
                const tab = window.tabsController.addTab(value)
                window.tabsController.selectTab(tab)
            }
      })
}

function event_toggleRenderer() {
    window.tabsController.onCurrent((_, controller) => {
        controller.onToggleRenderer()
    })
    return false
}

function event_toggleFocusTarget() {
    document.getElementById('isNewWillBeSelected').click()
    return false
}

function event_toggleArrowTarget() {
    document.getElementById('isExistingToNew').click()
}

function event_toggleHelp() {
    const currentHideHelpBar = (localStorage.getItem("__HIDE_HELP_BAR") || "false") === "true"
    localStorage.setItem("__HIDE_HELP_BAR", !currentHideHelpBar)

    setHelpBarAppearance()
}

function setHelpBarAppearance() {
    const currentHideHelpBar = (localStorage.getItem("__HIDE_HELP_BAR") || "false") === "true"
    if (currentHideHelpBar) {
        document.getElementsByTagName("footer")[0].style.display = "none";
    } else {
        document.getElementsByTagName("footer")[0].style.display = "block";
    }
}

function event_help() {
    Swal.fire({
        title: 'Graffiti',
        html: `Create customized callgraph directly from your favorite editor.
                <br /><br />
                <strong>Server</strong> - To run graffiti, Run the python server. 
                <br />
                <strong>Editor</strong> - Install graffiti in your editor. Then, connect it to the server. 
                <ul>
                <li>&lt;Ctrl+Shift+A&gt; - Add a new node to the graph.</li>
                <li>&lt;Ctrl+Shift+X&gt; - Add a new node to the graph with a custom text on the edge.</li>
                </ul>
                <strong>Web</strong> - click the top right button to connect to server.
                <ul>
                <li>A new node will be linked to the currently selected element.</li>
                <li>The new node will be automatically selected, unless the setting changed</li>
                <li>Right clicking a node will open it in the editor</li>
                <li>To find the matching keyboard shortcut, hover over the buttons.</li>
                <li>Double click an edge allows you to change its text or delete the edge</li>
                <li>To rename or remove a graph, right click the tab's name.</li>
                <li>A list of the linked projects is also available under the tab</li>
                <li>When node is selected, use 1-5 to theme it.</li>
                <li>Right click the center button to toggle the renderer between default and elk</li>
                </ul>
        `,
        icon: 'question',
        width: '48em',
        footer: 'To toggle the help bar, press Ctrl+?'
    })
}

function event_setTheme(themeIndex) {
    window.tabsController.onCurrent((_, controller) => {
        controller.onSetTheme(themeIndex)
    })
}

function event_addTextNode() {
    // FIXME don't depend on network controller
    if (!('networkController' in window)) {
        Swal.fire({
            title: 'Not connected',
            position: 'bottom-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
        })
        return
    }

    Swal.fire({
        title: 'Add text node',
        input: 'textarea',
        inputValue: '',
        footer: 'You can use **text** for bold, and *text* for italic',
        showCancelButton: true
        }).then(({value=null}) => {
            if (value != null && value != '') {
                // Bit of a hack, but why not
               window.networkController.handleMessage({type: MSG_ADD_NODE_AND_EDGE, node: {
                    label: value,
                    isMarkdown: true
               }})
            }
        })
    
}

function main() {
    initiateDependencies();
    initiateHotkeys();
    initializeDragAndDrop();
    setHelpBarAppearance()

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
    hotkeys('ctrl+z,ctrl+shift+z,ctrl+y,ctrl+s,ctrl+o,ctrl+i,ctrl+alt+shift+i,delete,home,shift+/,ctrl+shift+/,1,2,3,4,5', function (event, handler) {
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
            case 'ctrl+o':
                event_import();
                return false;
            case 'ctrl+i':
                event_toggleArrowTarget()
                return false;
            case 'ctrl+alt+shift+i':
                event_toggleFocusTarget()
                return false;
            case 'delete':
                event_delete();
                return false;
            case 'home':
                event_center();
                return false;
            case 'shift+/':
                event_help();
                return false;
            case 'ctrl+shift+/':
                event_toggleHelp();
                return false
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                themeIndex = parseInt(event.key) -1
                event_setTheme(themeIndex)
                return
        }
    });
}

function initializeDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, e => {
            e.preventDefault()
            e.stopPropagation()
        }, false)
    })

    document.body.addEventListener('drop', function handleDrop(e) {
        for (const file of e.dataTransfer.files) {
            event_import_onFile(file)
        }
    }, false)
}



main()
