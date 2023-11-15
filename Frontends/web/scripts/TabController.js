const ADD_EDGE = "addEdge"
const ADD_NODE = "addNode"
const REMOVE_EDGE = "removeEdge"
const REMOVE_NODE = "removeNode"
const CHANGE_EDGE_LABEL = "changeEdgeLabel"
const CHANGE_NODE_LABEL = "changeNodeLabel"
const CHANGE_THEME = "changeTheme"
const SWAP_EDGES = "swapEdges"
const SWAP_IDS = "swapIds"
const MARKER = "marker"

const THEMES = [
    ['#A9D18E', 'black'],
    ['#BDD0E9', 'black'],
    ['#FFE699', 'black'],
    ['#ED7D31', 'black'],
    ['#D9D9D9', 'black'],
    ['#FF695E', 'black'],
    ['#FFDDE1', 'black'],
]
const MARKDOWN_THEME = ['white', 'black', '#e5e5e5']
const COMMENT_THEME = ['#bfbfbf', 'black', '#858585']

const HISTORY_MARKER = { type: MARKER, data: {} }

let globalCounter = 0

class TabController {
    constructor() {
        this.view = null
        this.nodes = new DataSet([])
        this.edges = new DataSet([])
        this.undoHistory = []
        this.redoHistory = []
        this.idCounter = 1
        this.selectedNode = null
        this.container = null
        this.wrapper = null
        this.zoom = null
        this.mermaidId = "mermaidStuff" + (globalCounter++)
        this.elkRenderer = false
        this.cachedMermaid = null
        this.isKeymapReversed = strToBool(localStorage.getItem("isKeymapReversed"));
        this.enableHoverDoc = strToBool(localStorage.getItem("hoverDoc"))
    }

    initView(view) {
        this.view = view

        if (typeof customElements.get("diagram-div") === "undefined") {
            customElements.define("diagram-div", MermaidDiv)
        }

        // add layout
        const wrapperLayout = htmlToElement('<div class="content"><div class="graph"></div></div>')
        this.view.appendChild(wrapperLayout)
        this.wrapper = wrapperLayout

        // init layout
        const container = wrapperLayout.querySelector(".graph")
        this.container = container

        this.zoom = panzoom(this.container, {
            smoothScroll: false
        })
        this.draw()
    }

    deinitView(view) {
        // do nothing
    }

    export() {
        return JSON.stringify([this.idCounter, this.nodes.asReadOnly(), this.edges.asReadOnly(), {
            'elkRenderer': this.elkRenderer
        }], null, 4)
    }

    import(data) {
        const [id, nodes, edges, config = {}] = JSON.parse(data)

        this.reset()
        this.nodes = new DataSet(nodes)
        this.edges = new DataSet(edges)
        this.idCounter = id
        this.elkRenderer = config['elkRenderer'] || false
        this.cachedMermaid = null
        this.draw()
    }

    resetScrolling() {
        this.zoom.moveTo(0, 0)
        this.zoom.zoomAbs(0, 0, 1)
    }

    resetScrollingToSelected() {
        if (this.selectedNode == null) {
            this.resetScrolling()
        } else {
            this.container.style.visibility = "hidden"
            this.zoom.zoomAbs(0, 0, 1)

            setTimeout(() => {
                const selectedElement = this.#getDomElementFromId(this.selectedNode.id)
                const [boxX, boxY, boxWidth, boxHeight] = this.#getSvgInnerPosition(selectedElement)
                const screenHeight = document.body.getBoundingClientRect().height

                const { x: svgX, y: svgY, width: svgWidth, height: svgHeight, offsetWidth, offsetHeight,
                    viewportWidth, viewportHeight, viewportRectX, viewportRectY } = this.#getViewBox()

                // calculate normalized position
                const xRel = (boxX - svgX) / svgWidth
                const yRel = (boxY - svgY) / svgHeight
                const originalX = xRel * offsetWidth
                const originalY = yRel * offsetHeight
                const x = -originalX + viewportWidth / 2
                const y = -originalY + viewportHeight / 2 - ((screenHeight - viewportHeight) / 2)
                this.zoom.moveTo(x, y)

                setTimeout(() => {
                    const [newX, newY, newWidth] = this.#getRectPosition(selectedElement)
                    const [zoomX, zoomY] = [newX - viewportRectX, newY - viewportRectY]

                    const ratio = Math.max((viewportHeight / 3) / newWidth, 3)
                    this.zoom.zoomAbs(zoomX, zoomY, ratio)

                    setTimeout(() => {
                        this.container.style.visibility = "visible"
                    }, 50)
                }, 50)
            }, 50)
        }
    }

    #getSvgInnerPosition(element) {
        // Group transformation
        const [transformX, transformY] = this.#getSvgTransform(element)

        // Inner rect relative position + size
        const innerRect = element.getElementsByTagName('rect')[0]
        const [rectX, rectY] = [innerRect.x, innerRect.y].map(toValue)
        const [rectWidth, rectHeight] = [innerRect.width, innerRect.height].map(toValue)

        // Calculate the x,y of the middle of element
        return [transformX + rectX + rectWidth / 2, transformY + rectY + rectHeight / 2, rectWidth, rectHeight]
    }

    #getRectPosition(element) {
        // Inner rect relative position + size
        const innerRect = element.getElementsByTagName('rect')[0]
        const boudingRect = innerRect.getBoundingClientRect()
        const [rectX, rectY] = [boudingRect.x, boudingRect.y]
        const [rectWidth, rectHeight] = [innerRect.width, innerRect.height].map(toValue)

        // Calculate the x,y of the middle of element
        return [rectX + rectWidth / 2, rectY + rectHeight / 2, rectWidth, rectHeight]
    }

    #getSvgTransform(element) {
        var xforms = element.transform.baseVal
        var firstXForm = xforms.getItem(0)
        if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            return [firstXForm.matrix.e, firstXForm.matrix.f]
        }
        return [0, 0]
    }

    #getViewBox() {
        const svg = this.container.getElementsByTagName('diagram-div')[0].shadowRoot.querySelector('svg')
        const svgRect = svg.getClientRects()[0]
        const viewportRect = this.wrapper.getClientRects()[0]
        const svgViewBox = svg.viewBox.baseVal
        return {
            x: svgViewBox.x, y: svgViewBox.y, width: svgViewBox.width, height: svgViewBox.height,
            offsetWidth: svgRect.width, offsetHeight: svgRect.height,
            viewportWidth: viewportRect.width, viewportHeight: viewportRect.height,
            viewportRectX: viewportRect.x, viewportRectY: viewportRect.y
        }
    }

    toMermaid(gui = false, elkRenderer = false) {
        let s = ""

        if (gui && this.cachedMermaid != null) {
            s = this.cachedMermaid
        } else {
            const [nodes, edges] = [this.nodes.asReadOnly(), this.edges.asReadOnly()]
            const themesForNodes = THEMES.map(() => [])
            const defaultMarkdownTheme = []
            const commentNodes = []
            const lineNodes = []
            const commentNodesSet = new Set()


            if (nodes.length == 0) {
                return ""
            }

            // to support older clients, we switch from flowchart to graph for export
            s = gui ? (elkRenderer ? "flowchart-elk TD\n" : "flowchart TD\n") : "graph TD\n"

            // Add nodes
            for (const node of nodes) {
                const nodeName = `N${node.id}`
                if (node.extra.isMarkdown) {
                    if (gui) {
                        if (node.extra.isComment) {
                            s += `  ${nodeName}{{"\`${escapeHtml(node.label, gui)}\`"}}\n`
                        } else {
                            s += `  ${nodeName}(["\`${escapeHtml(node.label, gui)}\`"])\n`
                        }
                    } else {
                        // We support older mermaid version, so no markdown support
                        s += `${nodeName}("${escapeMarkdown(node.label)}")\n`
                    }

                    if (node.extra.isComment) {
                        commentNodesSet.add(node.id)
                    }

                    if (node.extra.isComment) {
                        commentNodes.push(nodeName)
                    } else if (!node.theme) {
                        defaultMarkdownTheme.push(nodeName)
                    } else {
                        themesForNodes[node.theme].push(nodeName)
                    }
                }
                else {
                    s += `  ${nodeName}["${escapeHtml(node.label, gui)}"]\n`
                    themesForNodes[node.theme || 0].push(nodeName)


                    if (node.extra.hasOwnProperty('line')) {
                        lineNodes.push(nodeName)
                    }
                }
            }


            // Add edges
            s += "\n\n"
            for (const edge of edges) {
                if (commentNodesSet.has(edge.to) || commentNodesSet.has(edge.from)) {
                    s += `N${edge.from} --- N${edge.to}\n`
                } else if ('label' in edge) {
                    s += `N${edge.from}-->|"${escapeHtml(edge.label, gui)}"|N${edge.to}\n`
                } else {
                    s += `N${edge.from} --> N${edge.to}\n`
                }
            }

            // Add themes
            s += "\n\n"
            for (const [index, [backgroundColor, textColor]] of THEMES.entries()) {
                if (themesForNodes[index].length != 0) {
                    s += `classDef theme${index} fill:${backgroundColor},color:${textColor},stroke:black,stroke-width:2px\n`
                    s += `class ${themesForNodes[index].join(',')} theme${index}\n`
                }
            }

            if (defaultMarkdownTheme.length != 0) {
                s += `classDef markdownDefaultTheme fill:${MARKDOWN_THEME[0]},color:${MARKDOWN_THEME[1]},stroke:black,stroke-width:2px\n`
                s += `class ${defaultMarkdownTheme.join(',')} markdownDefaultTheme\n`
            }

            if (commentNodes.length != 0) {
                s += `classDef comment fill:${COMMENT_THEME[0]},color:${COMMENT_THEME[1]},stroke:black,stroke-width:2px\n`
                s += `class ${commentNodes.join(',')} comment\n`
            }

            if (lineNodes.length != 0) {
                s += `classDef lineNode stroke-dasharray: 5 5\n`
                s += `class ${lineNodes.join(',')} lineNode\n`
            }

            // Cache the created mermaid
            if (gui) {
                this.cachedMermaid = s
            }
        }

        return s
    }

    modifyElkGraph(graph) {
        // Increase spacing for comments
        graph.layoutOptions['org.eclipse.elk.spacing.commentNode'] = 30
        graph.layoutOptions['org.eclipse.elk.layered.considerModelOrder.strategy'] = 'PREFER_EDGES'

        // Annotate comments
        const commentIds = new Set(this.queryNodes('isComment', true).map(n => `N${n.id}`))
        if (commentIds.size > 0) {
            graph.children.forEach(child => {
                if (commentIds.has(child.id)) {
                    child.layoutOptions['org.eclipse.elk.commentBox'] = true
                }
            })
        }
    }

    onClick(target, elementId) {
        this.selectNode(elementId)
    }

    onRightClick(target, elementId) {
        const node = this.nodes.get(elementId)
        if ('address' in node.extra && 'networkController' in window) {
            window.networkController.send(JSON.stringify({
                version: 2,
                address: node.extra.address,
                project: node.extra.project
            }))
        } else if (node.extra.isMarkdown) {
            this.editMarkdownNode(node)
        }
    }

    onMiddleClick(target, elementId, isCtrlPressed, isShiftPressed) {
        if (this.selectedNode != null) {
            this.swapNodes(this.selectedNode.id, elementId, !isCtrlPressed, isShiftPressed)
        }
    }

    onToggleRenderer() {
        this.elkRenderer = !this.elkRenderer
        this.cachedMermaid = null
        this.draw()
    }

    onSetTheme(themeIndex) {
        if (this.selectedNode != null) {
            const currentTheme = this.selectedNode.theme || 0
            if (currentTheme != themeIndex) {
                this.selectedNode.theme = themeIndex

                // update history
                this.redoHistory = []
                this.addUndoMarker()
                this.undoHistory.push({ type: CHANGE_THEME, data: { id: this.selectedNode.id, oldTheme: currentTheme, newTheme: themeIndex } })

                this.cachedMermaid = null

                this.draw()
            }
        }
    }

    #setLabelForEdge(edge, value) {
        if (value) {
            edge.label = value
        } else {
            delete edge.label
        }
    }

    onEdgeRightClick(src, dst) {
        const _this = this
        const edge = this.edges.filter(item => item.from == src && item.to == dst)[0]
        const edgeOldLabel = edge.label

        setTimeout(function () {
            Swal.fire({
                title: 'Edge\'s text',
                input: 'text',
                inputValue: edge.label || "",
                showCancelButton: true,
                showDenyButton: true,
                denyButtonText: `Delete the edge`,
            }).then(result => {
                if (result.isConfirmed) {
                    const { value } = result
                    if (value != null) {
                        _this.#setLabelForEdge(edge, value)

                        // update history
                        _this.redoHistory = []
                        _this.addUndoMarker()
                        _this.undoHistory.push({ type: CHANGE_EDGE_LABEL, data: { id: edge.id, oldLabel: edgeOldLabel, newLabel: value } })

                        _this.cachedMermaid = null

                        _this.draw()
                    }
                } else if (result.isDenied) {
                    _this.edges.remove(edge.id)

                    // update history
                    _this.redoHistory = []
                    _this.addUndoMarker()
                    _this.undoHistory.push({ type: REMOVE_EDGE, data: { ...edge } })

                    _this.cachedMermaid = null

                    _this.draw()
                }
            })
        })
    }

    editMarkdownNode(node) {
        const _this = this
        const oldLabel = node.label
        if (node != null) {
            Swal.fire({
                title: node.extra.isComment ? 'Edit comment' : 'Edit Markdown node',
                input: 'textarea',
                inputValue: node.label,
                footer: 'You can use **text** for bold, and *text* for italic',
                showCancelButton: true,
                showDenyButton: true,
                denyButtonText: 'Delete',
                didOpen: patchOnKeyDown
            }).then(result => {
                if (result.isConfirmed) {
                    const { value = null } = result
                    if (value != null && value != '') {
                        node.label = value

                        // update history
                        _this.redoHistory = []
                        _this.addUndoMarker()
                        _this.undoHistory.push({ type: CHANGE_NODE_LABEL, data: { id: node.id, oldLabel: oldLabel, newLabel: value } })

                        _this.cachedMermaid = null

                        _this.draw()
                    }
                } else if (result.isDenied) {
                    this.deleteNode(node)
                }
            })
        }
    }

    draw() {
        setTimeout(() => {
            if ('tabsController' in window) {
                window.tabsController.save()
            }
        })

        const _this = this

        const data = this.toMermaid(true, this.elkRenderer)
        if (data.length == 0) {
            this.container.textContent = "empty graph"
            return
        }

        this.container.removeAttribute('data-processed');

        mermaid.render(this.mermaidId, data).then(({ svg, bindFunctions }) => {
            const el = document.createElement("div")
            el.innerHTML = svg
            const shadow = document.createElement("diagram-div")
            shadow.shadowRoot.appendChild(el)
            replaceChildren(_this.container, [shadow])
        }).then(() => {
            // hacks to add listeners
            const markdownConverter = new showdown.Converter()
            const nodesArray = [..._this.container.getElementsByTagName('diagram-div')[0].shadowRoot.querySelectorAll('.node')]
            for (const node of nodesArray) {
                // fix pointer
                node.classList.add("clickable")
                // add click event
                if (!node.hasAttribute("has_listeners")) {
                    const onClick = (!_this.isKeymapReversed ? _this.onClick : _this.onRightClick).bind(_this)
                    const onRightClick = (!_this.isKeymapReversed ? _this.onRightClick : _this.onClick).bind(_this)
                    node.setAttribute("has_listeners", "true")
                    node.addEventListener('click', (event) => {
                        onClick(event.currentTarget, getIdFromNode(event.currentTarget))
                        event.preventDefault()
                        event.stopPropagation()
                    })
                    // add right click event
                    node.addEventListener('contextmenu', (event) => {
                        onRightClick(event.currentTarget, getIdFromNode(event.currentTarget))
                        event.preventDefault()
                        event.stopPropagation()
                    })

                    // add middle click event
                    node.addEventListener('auxclick', (event) => {
                        if (event.button == 1) {
                            _this.onMiddleClick(event.currentTarget, getIdFromNode(event.currentTarget), event.ctrlKey, event.shiftKey)
                            event.preventDefault()
                            event.stopPropagation()
                        }
                    })

                    const extra = _this.nodes.get(getIdFromNode(node)).extra
                    const hover = extra.hover?.join('\n') ?? extra.detail
                    if (hover) {
                        tippy(node, {
                            content: '<div class="hoverDoc">' + markdownConverter.makeHtml(hover) + '</div>',
                            allowHTML: true,
                            delay: [300, 0],
                            placement: 'bottom',
                            hideOnClick: true,
                            onShow: () => _this.enableHoverDoc
                        });
                    }

                    _this.#selectNodeInUI(null, _this.selectedNode?.id)
                }
            }

            const edgesArray = [..._this.container.getElementsByTagName('diagram-div')[0].shadowRoot.querySelectorAll('.flowchart-link')]
            for (const edge of edgesArray) {
                // fix pointer
                edge.style.cursor = "pointer"
                // add click event
                if (!edge.hasAttribute("has_listeners")) {
                    edge.setAttribute("has_listeners", "true")
                    edge.addEventListener('contextmenu', (event) => {
                        const classes = [...edge.classList]
                        const src = parseInt(classes.filter(it => it.startsWith('LS-N'))[0].substring(4))
                        const dst = parseInt(classes.filter(it => it.startsWith('LE-N'))[0].substring(4))
                        _this.onEdgeRightClick(src, dst)
                        event.preventDefault()
                        event.stopPropagation()
                    })
                }
            }
        })
    }

    reset(shouldSupportUndo = false) {
        if (shouldSupportUndo) {
            // Add all node and edges to undo
            this.addUndoMarker()
            this.undoHistory.push(...this.nodes.map((node) => ({ type: REMOVE_NODE, data: { ...node } })))
            this.undoHistory.push(...this.edges.map((edge) => ({ type: REMOVE_EDGE, data: { ...edge } })))
        } else {
            this.undoHistory = []
        }

        this.redoHistory = []
        this.edges.clear()
        this.nodes.clear()

        this.selectedNode = null
        this.cachedMermaid = null

        this.draw()
    }

    addNode(node) {
        updateNodeProperties(node)

        // create the vis node
        const visNode = {
            id: this.idCounter++,
            label: node.label,
            extra: node,
        }

        // add to the network
        this.nodes.add(visNode)

        // update history
        this.redoHistory = []
        this.undoHistory.push({ type: ADD_NODE, data: { ...visNode } })

        this.cachedMermaid = null

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

        this.cachedMermaid = null

        this.draw()

        return visEdge
    }

    queryNode(propertyName, propertyValue) {
        const result = this.queryNodes(propertyName, propertyValue)
        if (result.length == 1) {
            return result[0]
        }
        return null;
    }

    queryNodes(propertyName, propertyValue) {
        return this.nodes.filter(item => item.extra[propertyName] == propertyValue);
    }

    selectNode(id, shouldRedraw = false) {
        const oldSelectedNode = this.selectedNode
        if (id == null) {
            this.selectedNode = null
        } else {
            this.selectedNode = this.nodes.get(id)
            if (this.selectedNode.extra.isUnclickable) {
                // Clicking on comment is like clicking on the background
                this.selectedNode = null
            }
        }
        if (oldSelectedNode != this.selectedNode) {
            if (shouldRedraw) {
                this.cachedMermaid = null
                this.draw()
            } else {
                this.#selectNodeInUI(oldSelectedNode?.id, id)
            }
        }
    }

    #selectNodeInUI(oldId, newId) {
        if (this.nodes.size() != 0) {
            const nodesContainer = this.#getDomNodesContainerElement()
            if (!nodesContainer) {
                // Nothing is drawn, so no need to do anything
                return
            }

            if (oldId != null) {
                const oldSelectedElement = this.#getDomElementFromId(oldId, nodesContainer)
                const oldSelectedBorders = oldSelectedElement.querySelector('rect')

                oldSelectedElement.style = ""
                oldSelectedBorders.style = ""
            }
            if (newId != null) {
                const newSelectedElement = this.#getDomElementFromId(newId, nodesContainer)
                const newSelectedBorders = newSelectedElement.querySelector('rect')

                newSelectedElement.style = "filter: brightness(90%);"
                newSelectedBorders.style = "stroke:#333 !important; stroke-width:4px !important;"
            }
        }
    }

    #getDomElementFromId(id, nodesContainer = null) {
        if (!nodesContainer) {
            nodesContainer = this.#getDomNodesContainerElement()
        }
        return nodesContainer.querySelector(`g.node[id^=flowchart-N${id}-]`)

    }

    #getDomNodesContainerElement() {
        return this.container.getElementsByTagName('diagram-div')[0]?.shadowRoot?.querySelector('.nodes')
    }

    swapNodes(id1, id2, swapParents, swapIds) {
        if (id1 == id2) {
            return
        }

        if (swapIds) {
            this.#swapIdsAsAction(id1, id2)
        } else {
            this.#trySwapEdges(id1, id2, swapParents)
        }
    }

    #swapIds(id1, id2) {
        const swap = (id, id1, id2) => id === id1 ? id2 : (id === id2 ? id1 : id)

        this.edges = new DataSet(this.edges.map(e => ({ ...e, from: swap(e.from, id1, id2), to: swap(e.to, id1, id2) })))
        this.nodes = new DataSet(this.nodes.map(n => ({ ...n, id: swap(n.id, id1, id2) })))

        if (this.selectedNode != null) {
            this.selectedNode = this.nodes.get(swap(this.selectedNode.id, id1, id2))
        }
    }

    #swapIdsAsAction(id1, id2) {
        this.#swapIds(id1, id2)

        // update history
        this.redoHistory = []
        this.addUndoMarker()
        this.undoHistory.push({ type: SWAP_IDS, data: { id1, id2 } })

        this.cachedMermaid = null
        this.draw()

        logEvent("Swapped nodes id")
    }

    #trySwapEdges(id1, id2, swapParents) {
        const otherSide = swapParents ? (e) => e.from : (e) => e.to
        const mySide = swapParents ? (e) => e.to : (e) => e.from
        const type = swapParents ? "parent" : "son"

        const firstNodeEdges = this.edges.filter(e => mySide(e) == id1)
        const secondNodeEdges = this.edges.filter(e => mySide(e) == id2)
        const commonSides = firstNodeEdges.filter(e => secondNodeEdges.some(e2 => otherSide(e) == otherSide(e2))).map(otherSide)

        if (commonSides.length == 0) {
            logEvent(`No common ${type} for the two nodes`)
        } else if (commonSides.length > 1) {
            // TODO: support multiple common sides 
            logEvent(`Multiple common ${type}s for the two nodes`)
        } else {
            const side = commonSides[0]
            const firstNodeSpecificEdges = firstNodeEdges.filter(e => otherSide(e) == side)
            const secondNodeSpecificEdges = secondNodeEdges.filter(e => otherSide(e) == side)

            if (firstNodeSpecificEdges.length != 1 || secondNodeSpecificEdges.length != 1) {
                logEvent(`Multiple edges to the same ${type}`)
            } else {
                this.#swapEdges(firstNodeSpecificEdges[0], secondNodeSpecificEdges[0])

                logEvent("Tried to swap nodes")
            }
        }
    }

    #swapEdges(edge1, edge2) {
        this.edges.swap(edge1.id, edge2.id)

        // update history
        this.redoHistory = []
        this.addUndoMarker()
        this.undoHistory.push({ type: SWAP_EDGES, data: { id1: edge1.id, id2: edge2.id } })

        this.cachedMermaid = null
        this.draw()
    }

    addUndoMarker() {
        this.undoHistory.push(HISTORY_MARKER)
    }

    undo() {
        this.cachedMermaid = null

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
                } else if (type == CHANGE_EDGE_LABEL) {
                    const { id, oldLabel } = data
                    const edge = this.edges.get(id)
                    this.#setLabelForEdge(edge, oldLabel)
                } else if (type == CHANGE_NODE_LABEL) {
                    const { id, oldLabel } = data
                    const node = this.nodes.get(id)
                    node.label = oldLabel
                } else if (type == CHANGE_THEME) {
                    const { id, oldTheme } = data
                    const node = this.nodes.get(id)
                    node.theme = oldTheme
                } else if (type == SWAP_EDGES) {
                    const { id1, id2 } = data
                    this.edges.swap(id1, id2)
                } else if (type == SWAP_IDS) {
                    const { id1, id2 } = data
                    this.#swapIds(id1, id2)
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
        this.cachedMermaid = null


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
                } else if (type == CHANGE_EDGE_LABEL) {
                    const { id, newLabel } = data
                    const edge = this.edges.get(id)
                    this.#setLabelForEdge(edge, newLabel)
                } else if (type == CHANGE_NODE_LABEL) {
                    const { id, newLabel } = data
                    const node = this.nodes.get(id)
                    node.label = newLabel
                } else if (type == CHANGE_THEME) {
                    const { id, newTheme } = data
                    const node = this.nodes.get(id)
                    node.theme = newTheme
                } else if (type == SWAP_EDGES) {
                    const { id1, id2 } = data
                    this.edges.swap(id1, id2)
                } else if (type == SWAP_IDS) {
                    const { id1, id2 } = data
                    this.#swapIds(id1, id2)
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
            this.deleteNode(this.selectedNode)
        }
    }

    deleteNode(removedNode) {
        const removedNodeId = removedNode.id
        // Start undo session
        this.addUndoMarker()
        // Remove the node
        this.nodes.remove(removedNode.id)
        // Update undo history for node
        this.undoHistory.push({ type: REMOVE_NODE, data: { ...removedNode } })
        // Get all edges containing the node
        const removedEdges = this.edges.filter((edge) => edge.from == removedNodeId || edge.to == removedNodeId)
        // Remove them, and update undo history
        for (const removedEdge of removedEdges) {
            this.edges.remove(removedEdge.id)
            this.undoHistory.push({ type: REMOVE_EDGE, data: { ...removedEdge } })

            // Remove the connected node if it is a comment
            const maybeComment = this.nodes.get(removedEdge.to)
            if (maybeComment && maybeComment.extra.isComment) {
                // We don't have to call deleteNode recursively since it is a simpler case
                // It has only one edge, which we've already removed
                this.nodes.remove(maybeComment.id)
                this.undoHistory.push({ type: REMOVE_NODE, data: { ...maybeComment } })
            }

        }

        // update history
        this.redoHistory = []

        // remember to clear selected node
        if (this.selectedNode == removedNode) {
            this.selectedNode = null
        }

        this.cachedMermaid = null

        this.draw()
    }

    updateNodes(selection, updateObj, version) {
        let updates;
        if (version == 1) {
            updates = this.nodes.filter(item => this.#selectionV1(item.extra, selection))
        } else {
            updates = this.nodes.filter(item => this.#selectionV2(item.extra, selection))
        }

        updates = updates.map(item => mergeToVisNode(item, updateObj))
        this.nodes.updateOnly(updates)

        const _this = this;
        const updateUndoItem = item => {
            if (item.type != ADD_NODE && item.type != REMOVE_NODE)
                return item


            const shouldUpdate = version == 1 ? _this.#selectionV1(item.data.extra, selection) : _this.#selectionV2(item.data.extra, selection)

            if (shouldUpdate) {
                return ({ type: item.type, data: mergeToVisNode(item.data, updateObj) })
            } else {
                return item
            }
        }

        this.undoHistory = this.undoHistory.map(updateUndoItem)
        this.redoHistory = this.redoHistory.map(updateUndoItem)

        if (updates.length != 0) {
            // A node was actually updated, redraw
            this.cachedMermaid = null
            this.draw()
        }
    }

    #selectionV1(extra, selection) {
        // Scheme of selection is: [(key1, value1), (key2, value2)] and we requires key1=value1, key2=value2
        for (const [key, value] of selection) {
            if (!(key in extra)) return false;
            if (extra[key] != value) return false;
        }
        return true;
    }

    #selectionV2(extra, selection) {
        // Scheme of selection is: [[(key1, value1), (key2, value2)],[(key3, value3), (key4, value4)]] and we requires (key1=value1, key2=value2) or (key3=value3, key4=value4)
        outerLoop: for (const specificSelection of selection) {
            for (const [key, value] of specificSelection) {
                if (!(key in extra)) return false;
                if (extra[key] != value) continue outerLoop;
            }
            return true;
        }
        return false;
    }

    getProjects() {
        return new Set(this.nodes.map(it => ('project' in it.extra) ? it.extra.project : null).filter(it => it != null));
    }
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

function createFromTo(currentNode, newNode, isExistingToNew) {
    if (isExistingToNew)
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
    const res = unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;').replaceAll('`', '#96;');
    return gui ? res : res.replace('\n', '')
}

function escapeMarkdown(unsafe) {
    const htmlEscaped = escapeHtml(unsafe, true).replace('\n', '<br>')
    return htmlEscaped.replaceAll(/\*\*(.*?)\*\*/g, '<b>$1</b>').replaceAll(/\*(.*?)\*/g, '<i>$1</i>')
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function replaceChildren(el, nodes) {
    if (el.replaceChildren)
        return el.replaceChildren(...nodes); // supported Chrome 86+

    el.innerHTML = "";
    el.append(...nodes);
}

class MermaidDiv extends HTMLElement {
    constructor() {
        super()
        const shadowRoot = this.attachShadow({ mode: "open" })

        const sheet = new CSSStyleSheet();
        sheet.replaceSync("* { outline: 0px solid transparent !important;");
        shadowRoot.adoptedStyleSheets = [sheet];
    }
}

function strToBool(s) {
    // will match one and only one of the string 'true','1', or 'on' rerardless
    // of capitalization and regardless off surrounding white-space.

    regex = /^\s*(true|1|on)\s*$/i

    return regex.test(s);
}

function getIdFromNode(node) {
    return parseInt(node.id.split('-')[1].substring(1))
}

function patchOnKeyDown(dialog) {
    // Set ctrl+enter behavior for textarea and whole dialog
    [dialog, ...dialog.getElementsByTagName("textarea")].forEach(ta => {
        ta.onkeydown = (e) => {
            if (e.keyCode == 13) {
                if (e.ctrlKey) {
                    Swal.clickConfirm()
                    //emulate enter press with a line break here.
                    return true;
                }
            }
        }
    })
}

function logEvent(title) {
    Swal.fire({
        title,
        position: 'bottom-end',
        toast: true,
        showConfirmButton: false,
        timer: 1500
    })
}

function toValue(val) {
    return val.baseVal.value
}