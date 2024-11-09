import DataSet from '../utils/DateSet'

export type ColoringByTheme = number
export type ColoringByColor = [r: number, g: number, b: number]
export type ColoringDefault = undefined
export type Coloring = ColoringByColor | ColoringByTheme | ColoringDefault

export type elementId = number
export enum elementType {
    node = 'node',
    group = 'group',
    edge = 'edge',
}

/**
 * Base Element for graph types
 */
export interface GraphElement {
    type: elementType
    id: elementId
}

export interface ComputedProperty {
    /** The name of the property to compute */
    name: string
    /** A format string for the property. Use {0}, {1}... as placeholders */
    format: string
    /** List of fields for the format string  */
    replacements: readonly string[]
}

export interface ExtraNodeProperties {
    /**
     * The project that the node came from
     */
    project?: string
    /**
     * The line/offset this node came from
     */
    line?: number | string
    /**
     * The documentation of the node from the IDE
     */
    hover?: string[]
    /**
     * The address of the node. the format is defined by each backend
     */
    address?: string
    /**
     * Whether this node is a comment. Undefined means not a comment
     */
    isComment?: boolean
    /**
     * Additional properties are allowed
     */
    [key: string]: unknown
}

export interface Node extends GraphElement {
    type: elementType.node
    /**
     * The label of the node
     */
    label: string
    /**
     * The label that will be actually shown
     */
    overrideLabel?: string
    /**
     * The color of the node
     */
    color: Coloring
    /**
     * Properties of the node that should be computed at runtime
     */
    computedProperties: readonly ComputedProperty[]
    /**
     * Extra properties used for updating and computing label
     */
    extraProperties: ExtraNodeProperties
    /**
     * The group that contains this node
     */
    containerGroup?: elementId
}

export interface Group extends GraphElement {
    type: elementType.group
    nodes: DataSet<Node>
    coloring: Coloring
    isExpanded: boolean
}

export type EdgeSide = Node | Group

export interface Edge extends GraphElement {
    type: elementType.edge
    /** The source from the directed edge */
    source: EdgeSide
    /** The destination of the directed edge */
    dest: EdgeSide
    /** Optional label for the edge */
    label?: string
}

export interface Graph {
    name: string
    nodes: DataSet<Node>
    groups: DataSet<Group>
    edges: DataSet<Edge>
}

export function compute(node: Node): Node {
    const extraProperties = { ...node.extraProperties }
    let label = node.label
    for (const { name, format, replacements } of node.computedProperties) {
        const replacementsValues: unknown[] = replacements.map(
            (name) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                ((node as any)[name] as unknown) ?? node.extraProperties[name]
        )
        const newValue = formatString(format, replacementsValues)
        if (name === 'label') {
            label = newValue
        } else {
            extraProperties[name] = newValue
        }
    }
    return {
        ...node,
        label,
        extraProperties,
    }
}

function formatString(formatStr: string, replacements: unknown[]): string {
    let str = formatStr
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const key in replacements) {
        str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), String(replacements[key]))
    }
    return str
}
