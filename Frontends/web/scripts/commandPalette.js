class CommandPalette {
    constructor(tabsController, ninjaElement) {
        this.tabsController = tabsController
        this.ninjaElement = ninjaElement
        this.baseCommands = this.#getBaseCommands()
    }

    open() {
        const commands = this.baseCommands.concat(this.#getTabsCommands())

        this.ninjaElement.setAttribute("placeholder", "Run command")
        this.ninjaElement.removeAttribute("hideBreadcrumbs")
        this.ninjaElement.data = commands
        this.ninjaElement.open()
    }

    close() {
        this.ninjaElement.close()
    }

    #getTabsCommands() {
        const tabs = this.tabsController.map((name, _, index) => {
            return {
                id: `tab@@${name}`,
                title: name,
                parent: 'SelectTab',
                handler: () => {
                    this.tabsController.selectTabByIndex(index)
                },
            }
        })

        return [
            {
                id: 'SelectTab',
                title: 'Select tab',
                icon: iconFor('menu2'),
                section: 'Tabs',
                children: tabs.map(tab => tab.id),
                handler: () => {
                    this.ninjaElement.open({ parent: 'SelectTab' });
                    return { keepOpen: true };
                },
            },
            ...tabs
        ]
    }

    #getBaseCommands() {
        const isCurvedEdges = strToBool(localStorage.getItem("isCurvedEdges"))
        const isKeymapReversed = strToBool(localStorage.getItem("isKeymapReversed"))
        const enableHoverDoc = strToBool(localStorage.getItem("hoverDoc"))

        return [
            {
                id: 'Import',
                title: 'Import graph from file',
                hotkey: 'Ctrl+O',
                icon: iconFor('import'),
                section: 'General',
                handler: () => { event_import(); },
            },
            {
                id: 'Export',
                title: 'Export current graph to file',
                hotkey: 'Ctrl+S',
                icon: iconFor('export'),
                section: 'General',
                handler: () => { event_export(); },
            },
            {
                id: 'ExportAll',
                title: 'Export all graffiti graphs to files',
                hotkey: 'Ctrl+Alt+S',
                icon: iconFor('export'),
                section: 'General',
                handler: () => { event_exportAll(); },
            },
            {
                id: 'AddTextNode',
                title: 'Add text node to the current graph',
                hotkey: 'Ctrl+Shift+Q',
                icon: iconFor('add'),
                section: 'General',
                handler: () => { event_addTextNode(); },
            },
            {
                id: 'AddCommentNode',
                title: 'Add comment linked to the currently selected node in the current graph',
                hotkey: 'Ctrl+Q',
                icon: iconFor('comment'),
                section: 'General',
                handler: () => { event_addComment(); },
            },
            {
                id: 'Reset',
                title: 'Reset the current graph',
                icon: iconFor('reset'),
                section: 'General',
                handler: () => { event_reset(); },
            },
            {
                id: 'Undo',
                title: 'Undo the recent change in the current graph',
                hotkey: 'Ctrl+Z',
                icon: iconFor('undo'),
                section: 'General',
                handler: () => { event_undo(); },
            },
            {
                id: 'Redo',
                title: 'Redo the recent change in the current graph',
                hotkey: 'Ctrl+Shift+Z',
                icon: iconFor('redo'),
                section: 'General',
                handler: () => { event_redo(); },
            },
            {
                id: 'Delete',
                title: 'Delete the currently selected node in the current graph',
                hotkey: 'Delete',
                icon: iconFor('delete'),
                section: 'General',
                handler: () => { event_delete(); },
            },
            {
                id: 'Focus',
                title: 'Zoom to the selected node in the current graph',
                hotkey: 'Home',
                icon: iconFor('layout'),
                section: 'General',
                handler: () => { event_focusOnSelected(); },
            },
            {
                id: 'ResetZoom',
                title: 'Reset zoom in the current graph',
                hotkey: 'Ctrl+Home',
                icon: iconFor('layout'),
                section: 'General',
                handler: () => { event_center(); },
            },
            {
                id: 'Search',
                title: 'Search a node in the current graph',
                hotkey: 'Ctrl+F',
                icon: iconFor('search'),
                section: 'General',
                handler: () => { event_search(); },
            },
            {
                id: 'SearchAll',
                title: 'Search a node in all of the graphs',
                hotkey: 'Ctrl+Shift+F',
                icon: iconFor('search'),
                section: 'General',
                handler: () => { event_searchAll(); },
            },
            {
                id: 'SwapArrowDirection',
                title: 'Swap arrow direction for generated nodes',
                hotkey: 'Ctrl+I',
                icon: iconFor('arrow'),
                section: 'General',
                handler: () => { event_toggleArrowTarget(); },
            },
            {
                id: 'SwapTargetFocus',
                title: 'Swap src/target selected node for generated nodes',
                hotkey: 'Ctrl+Alt+Shift+I',
                icon: iconFor('arrow'),
                section: 'General',
                handler: () => { event_toggleFocusTarget(); },
            },
            {
                id: 'ConnectToGraffiti',
                title: 'Connect to graffiti',
                icon: iconFor('connect'),
                section: 'General',
                handler: () => { event_connect(); },
            },
            {
                id: 'DisconnectFromGraffiti',
                title: 'Disconnect from graffiti',
                icon: iconFor('connect'),
                section: 'General',
                handler: () => { event_disconnect(); },
            },
            {
                id: 'ToggleRender',
                title: 'Toggle render between ELK and Dagre',
                hotkey: 'Shift+`',
                icon: iconFor('tree'),
                section: 'General',
                handler: () => { event_toggleRenderer(); },
            },
            {
                id: 'ShowHelp',
                title: 'Show the help manual',
                hotkey: 'Ctrl+?',
                icon: iconFor('help'),
                section: 'General',
                handler: () => { event_help(); },
            },
            {
                id: 'ToggleHelp',
                title: 'Toggle the visiblity of the help bar',
                hotkey: 'Ctrl+Shift+?',
                icon: iconFor('help'),
                section: 'General',
                handler: () => { event_toggleRenderer(); },
            },
            {
                id: 'Settings',
                title: 'Modify Settings',
                icon: iconFor('settings'),
                children: ['Theme', 'CurvedEdges', 'ReverseKeymap', 'HoverDoc'],
                handler: () => {
                    this.ninjaElement.open({ parent: 'Settings' });
                    return { keepOpen: true };
                },
            },
            {
                id: 'CurvedEdges',
                title: isCurvedEdges ? 'Disable curved edges' : 'Enable curved edges',
                parent: 'Settings',
                icon: iconFor('tree'),
                section: 'General',
                handler: () => {
                    localStorage.setItem('isCurvedEdges', !isCurvedEdges)
                    logEvent('Refresh the page to apply the changes')
                },
            },
            {
                id: 'Theme',
                title: isDarkMode() ? 'Change theme to Light' : 'Change theme to Dark',
                parent: 'Settings',
                icon: iconFor(isDarkMode() ? 'light' : 'dark'),
                section: 'General',
                handler: () => {
                    localStorage.setItem('darkMode', !isDarkMode())
                    logEvent('Refresh the page to apply the changes')
                },
            },
            {
                id: 'ReverseKeymap',
                title: 'Swap left and right click behavior',
                parent: 'Settings',
                icon: iconFor('click'),
                section: 'General',
                handler: () => {
                    localStorage.setItem('isKeymapReversed', !isKeymapReversed)
                    logEvent('Refresh the page to apply the changes')
                },
            },
            {
                id: 'Hoverdoc',
                title: (enableHoverDoc ? 'Disable' : 'Enable') + ' hover doc support',
                parent: 'Settings',
                icon: iconFor('description'),
                section: 'Expermintal',
                handler: () => {
                    localStorage.setItem('hoverDoc', !enableHoverDoc)
                    logEvent('Refresh the page to apply the changes')
                },
            },
            {
                id: 'NewTab',
                title: 'Create new tab',
                keywords: 'add tab',
                icon: iconFor('add'),
                section: 'Tabs',
                handler: () => { event_addTab(); },
            },
            {
                id: 'RenameTab',
                title: 'Rename the current tab',
                icon: iconFor('rename'),
                section: 'Tabs',
                handler: () => { event_renameCurrentTab(); },
            },
            {
                id: 'ShowSourcesForTab',
                title: 'Show the linked projects of the current tab',
                icon: iconFor('description'),
                section: 'Tabs',
                handler: () => { event_showSourcesCurrentTab(); },
            },
            {
                id: 'RemoveCurrentTab',
                title: 'Remove the current tab',
                keywords: 'Delete the current tab',
                icon: iconFor('delete'),
                section: 'Tabs',
                handler: () => { event_removeCurrentTab(); },
            },
            {
                id: 'AddEdgeBetweenSelected',
                title: 'Add an edge from the selected node to a specific node',
                icon: iconFor('arrow'),
                section: 'Graph',
                handler: () => { event_addEdgeBetweenSelected(); },
            },
            {
                id: 'UnselectNode',
                title: 'Unselect the currently selected node in the current graph',
                hotkey: 'Esc',
                icon: iconFor('click'),
                section: 'Graph',
                handler: () => { event_deselect(); },
            },
        ];
    }
}

function iconFor(name) {
    const theme = isDarkMode() ? 'filter: invert(100%);' : ''
    return `<img src="images/icon_${name}.svg" style="width: 24px; height: 24px; margin-right: 1em; ${theme}" />`
}
