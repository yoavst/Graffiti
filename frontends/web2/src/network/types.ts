import { ComputedProperty, ExtraNodeProperties, Node } from '../graph/types'

export enum messageType {
    addNodeWithEdge = 'addData',
    addNodesWithEdges = 'addDataBulk',
    updateNodes = 'updateNodes',
}

export type direction = 'n2e' | 'e2n'

export interface BaseMessage {
    type: messageType
}

export interface EdgeParams {
    isExistingToNew?: boolean
}

export interface AddNodeWithEdge extends BaseMessage {
    type: messageType.addNodeWithEdge
    node: ExtraNodeProperties & { computedProperties: readonly ComputedProperty[] }
    edge?: EdgeParams
}

export interface AddNodesWithEdges extends BaseMessage {
    type: messageType.addNodesWithEdges
    nodes: readonly [ExtraNodeProperties & { computedProperties: readonly ComputedProperty[] }]
    edge?: EdgeParams
    direction?: direction
}

export type SpecificSelection = readonly [field: string, value: string | number]
export type Selection = readonly SpecificSelection[]

export interface UpdateNodes extends BaseMessage {
    type: messageType.updateNodes
    version: 2
    update: ExtraNodeProperties
    selection: readonly Selection[]
}

export type Message = AddNodeWithEdge | AddNodesWithEdges | UpdateNodes

export function isSelected(node: Node, selection: readonly Selection[]): boolean {
    outerLoop: for (const specificSelection of selection) {
        for (const [field, value] of specificSelection) {
            if (!(field in node.extraProperties)) return false
            if (node.extraProperties[field] != value) continue outerLoop
        }
        return true
    }
    return false
}
