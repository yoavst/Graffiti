const MSG_ADD_NODE_AND_EDGE = "addData"
const MSG_ADD_NODES_AND_EDGES = "addDataBulk"
const MSG_UPDATE_NODES = "updateNodes"
const LOCAL_STORAGE_OLD_VERSION = "__OLD_VERSION"
const LOCAL_STORAGE_BACKUP_KEY = "__OLD_BACKUP"
const LOCAL_STORAGE_DEFAULT = { isKeymapReversed: false, hoverDoc: false, darkMode: true, isCurvedEdges: false }



function event_connect() {
    const url = document.getElementById("socketUrl").value

    // close global network controller
    if (window.networkController)
        window.networkController.close()

    window.networkController = new NetworkController(url, window.tabsController)
}

function event_disconnect() {
    window.networkController.close()
}

function event_reset() {
    Swal.fire({
        title: 'Reset',
        text: 'Do you want to clear the current tab?',
        showCancelButton: true
    }).then(({ value = null }) => {
        if (value) {
            window.tabsController.onCurrent((_, controller) => {
                controller.reset(shouldSupportUndo = true)
            })
        }
    })
}

function event_deselect() {
    window.tabsController.onCurrent((_, controller) => {
        controller.selectNode(null)
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

function event_shareGraph() {
    Swal.fire({
        title: "Share graph",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "JPEG",
        cancelButtonText: "Mermaid",
        denyButtonText: "SVG",
        input: "number",
        inputValue: "600",
        inputLabel: "dpi"
    }).then((result) => {
        window.tabsController.onCurrent((name, controller) => {
            if (result.isConfirmed) {
                // jpeg
                if (result.value) {
                    controller.exportToJpeg(name, parseInt(result.value))
                }
            } else if (result.isDenied) {
                // svg
                controller.exportToSvg(name)
            } else if (result.dismiss == Swal.DismissReason.cancel) {
                // mermaid
                const s = controller.toMermaid()

                try {
                    navigator.clipboard.writeText(s).then(function () {
                        logEvent('Copied to clipboard');
                    }, function (err) {
                        console.log(s)
                        logEvent("Logged to console")
                    });
                } catch (err) {
                    console.log(s)
                    logEvent("Logged to console")
                }
            }
        })
    })
}

function event_center() {
    window.tabsController.onCurrent((_, controller) => {
        controller.resetScrolling()
    })
    return false;
}

function event_focusOnSelected() {
    window.tabsController.onCurrent((_, controller) => {
        controller.resetScrollingToSelected()
    })
}

function event_export() {
    tabsController.onCurrent(exportController)
}

function event_exportAll() {
    function asUniqueNames(files) {
        const names = new Set();
        const transformedArray = [];
      
        files.forEach(file => {
          let { name, content } = file;
          let suffix = 1;
      
          while (names.has(name)) {
            name = `${file.name}_${suffix}`;
            suffix++;
          }
      
          names.add(name);
          transformedArray.push({ name, content });
        });
      
        return transformedArray;
      }

    const tar = tarts(asUniqueNames(tabsController.map((name, tabController) => ({
        name: `${name}`,
        content: tabController.export()
    }))).map(({name, content}) => ({name: `${name}.json`, content})))

    const blob = new Blob([tar], { type: 'application/tar' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'exported_graffitis.tar'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    return false
}

function exportController(name, controller) {
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
    }).then(({ value = null }) => {
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

function handleDarkMode() {
    if (isDarkMode()) {
        document.documentElement.classList.remove("lightTheme")
        document.querySelector('ninja-keys').classList.add("dark")
    } else {
        document.documentElement.classList.add("lightTheme")
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
                <li>Middle click to swap a node with the selected node (same parent). ctrl for same son, shift for id swap</li>
                <li>To rename or remove a graph, right click the tab's name.</li>
                <li>A list of the linked projects is also available under the tab</li>
                <li>When node is selected, use 1-7 to theme it.</li>
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
    addTextualNode('Add text node', { isMarkdown: true })
}

function event_addComment() {
    window.tabsController.onCurrent((_, controller) => {
        if (controller.selectedNode == null) {
            Swal.fire({
                title: 'No selected node to comment',
                position: 'bottom-end',
                toast: true,
                showConfirmButton: false,
                timer: 3000
            })
            return
        }

        addTextualNode('Add comment', { isMarkdown: true, isComment: true, isUnclickable: true }, { isExistingToNew: true })
    })
}

function addTextualNode(title, extra_node_properties, extra_edge_properties = {}) {
    // FIXME: don't depend on network controller
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
        title: title,
        input: 'textarea',
        inputValue: '',
        footer: 'You can use **text** for bold, and *text* for italic',
        showCancelButton: true,
        didOpen: patchOnKeyDown
    }).then(({ value = null }) => {
        if (value != null && value != '') {
            // Bit of a hack, but why not
            window.networkController.handleMessage({
                type: MSG_ADD_NODE_AND_EDGE, node: {
                    label: value,
                    ...extra_node_properties
                }, edge: extra_edge_properties
            })
        }
    })
}

function event_search() {
    window.tabsController.onCurrent((_, controller) => {
        const searchResults = controller.getSearchResults()
        if (searchResults.length != 0) {
            const ninja = document.querySelector('ninja-keys')
            ninja.setAttribute("placeholder", "Search node in current graph")
            ninja.setAttribute("hideBreadcrumbs", "")
            ninja.data = searchResults
            ninja.open()
        } else {
            logEvent("Empty graph")
        }
    })
}

function event_searchAll() {
    const searchResults = window.tabsController.map((name, controller, index) => {
        return controller.getSearchResults().map(result => {
            result.section = name
            result.id = `${index}@@${result.id}`
            const originalHandler = result.handler
            result.handler = () => {
                window.tabsController.selectTabByIndex(index)
                originalHandler()
            }
            return result
        })
    }).flatMap(l => l)

    if (searchResults.length != 0) {
        const ninja = document.querySelector('ninja-keys')
        ninja.setAttribute("placeholder", "Search node in all graphs")
        ninja.setAttribute("hideBreadcrumbs", "")
        ninja.data = searchResults
        ninja.open()
    } else {
        logEvent("Empty graphs")
    }
    return false;
}

function event_removeCurrentTab() {
    Swal.fire({
        title: 'Remove tab',
        text: 'Are you sure you want to remove the current tab',
        showCancelButton: true
    }).then(({ value = null }) => {
        if (value) {
            window.tabsController.removeCurrentTab()
        }
    })
}

function event_renameCurrentTab() {
    window.tabsController.renameCurrentTab()
}

function event_showSourcesCurrentTab() {
    window.tabsController.onCurrent((_, tabController) => {
        window.tabsController.openSourcesForTab(tabController)
    })
}

function event_addEdgeBetweenSelected() {
    window.tabsController.onCurrent((_, tabController) => {
        tabController.addNodeBetweenSelected()
    })
}

function event_overrideLabel() {
    window.tabsController.onCurrent((_, tabController) => {
        tabController.overrideCurrentNodeLabel();
    })
}

function event_commandPalette() {
    window.commandPalette.open();
}

function main() {
    initiateLocalStorage();
    initiateDependencies();
    initiateHotkeys();
    initializeDragAndDrop();
    setHelpBarAppearance();
    handleDarkMode();

    // Initiate tabs
    const tabsController = new TabsController(document.getElementsByClassName("tabs")[0], document.getElementsByClassName("view")[0], document.getElementById("context-menu"));
    tabsController.restore()

    window.tabsController = tabsController

    // initiate command palatte
    window.commandPalette = new CommandPalette(tabsController, document.querySelector('ninja-keys'))
}

function initiateDependencies() {
    // Initiate mermaid
    mermaid.initialize({
        securityLevel: 'loose',
        theme: 'forest',
        useMaxWidth: true,
    });
    // Fix tippy
    tippy.setDefaultProps({ maxWidth: '' })
}

function elk_beforeCallback(id, graph) {
    tabsController.onId(id, (_, controller) => {
        controller.modifyElkGraph(graph)
    })
}

function initiateHotkeys() {
    hotkeys('esc,ctrl+z,ctrl+shift+z,ctrl+y,ctrl+s,ctrl+alt+s,ctrl+o,ctrl+i,ctrl+alt+shift+i,ctrl+q,ctrl+f,ctrl+shift+f,ctrl+shift+q,ctrl+shift+p,delete,home,ctrl+home,shift+`,shift+/,ctrl+shift+/,1,2,3,4,5,6,7,8,9', function (event, handler) {
        window.commandPalette.close()
        switch (handler.key) {
            case 'esc':
                event_deselect();
                return false;
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
            case 'ctrl+alt+s':
                event_exportAll();
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
            case 'ctrl+q':
                event_addComment()
                return false
            case 'ctrl+shift+q':
                event_addTextNode()
                return false
            case 'delete':
                event_delete();
                return false;
            case 'home':
                event_focusOnSelected();
                return false;
            case 'ctrl+home':
                event_center();
                return false;
            case 'shift+/':
                event_help();
                return false;
            case 'ctrl+shift+/':
                event_toggleHelp();
                return false
            case 'shift+`':
                event_toggleRenderer();
                return false
            case 'ctrl+f':
                event_search();
                return false;
            case 'ctrl+shift+f':
                event_searchAll();
                return false;
            case 'ctrl+shift+p':
                event_commandPalette();
                return false;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                themeIndex = parseInt(event.key) - 1
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

function initiateLocalStorage() {
    backupOnUpdate();
    for (const key of Object.keys(LOCAL_STORAGE_DEFAULT)) {
        if (localStorage.getItem(key) == null) {
            localStorage.setItem(key, LOCAL_STORAGE_DEFAULT[key])
        }
    }
}

function backupOnUpdate() {
    if (window.version) {
        const oldVersion = parseFloat(localStorage.getItem(LOCAL_STORAGE_OLD_VERSION))
        if (oldVersion != window.version) {
            localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, localStorage.getItem("__SAVED_DATA"))
            localStorage.setItem(LOCAL_STORAGE_OLD_VERSION, window.version)
        }
    }
}


main()
