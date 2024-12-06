import { Coloring, Edge, elementId, elementType, Graph, Group, Node } from './types'

export enum operationType {
    addNode = 'addNode',
    addEdge = 'addEdge',
    removeEdge = 'removeEdge',
    removeNode = 'removeNode',
    changeEdgeLabel = 'changeEdgeLabel',
    changeNodeLabel = 'changeNodeLabel',
    overrideNodeLabel = 'overrideNodeLabel',
    changeNodeColoring = 'changeNodeColoring',
    swapEdgesId = 'swapEdgesId',
    swapNodesId = 'swapNodesId',
    addGroup = 'addGroup',
    removeGroup = 'removeGroup',
    addNodeToGroup = 'addNodeToGroup',
    removeNodeFromGroup = 'removeNodeFromGroup',
    changeGroupColoring = 'changeGroupColoring',
    changeGroupExpandedState = 'changeGroupExpandedState',
    changeGraphName = 'changeGraphName',
}

interface BaseOperation {
    type: operationType
}

export interface AddNode extends BaseOperation {
    type: operationType.addNode
    node: Node
}

export interface AddEdge extends BaseOperation {
    type: operationType.addEdge
    edge: Edge
}

export interface RemoveNode extends BaseOperation {
    type: operationType.removeNode
    node: Node
}

export interface RemoveEdge extends BaseOperation {
    type: operationType.removeEdge
    edge: Edge
}

export interface ChangeEdgeLabel extends BaseOperation {
    type: operationType.changeEdgeLabel
    edgeId: elementId
    oldLabel: string | undefined
    newLabel: string | undefined
}

export interface ChangeNodeLabel extends BaseOperation {
    type: operationType.changeNodeLabel
    nodeId: elementId
    oldLabel: string
    newLabel: string
}

export interface OverrideNodeLabel extends BaseOperation {
    type: operationType.overrideNodeLabel
    nodeId: elementId
    oldLabel: string | undefined
    newLabel: string | undefined
}

export interface ChangeNodeColoring extends BaseOperation {
    type: operationType.changeNodeColoring
    nodeId: elementId
    oldColoring: Coloring
    newColoring: Coloring
}

export interface SwapNodesId extends BaseOperation {
    type: operationType.swapNodesId
    id1: elementId
    id2: elementId
}

export interface SwapEdgesId extends BaseOperation {
    type: operationType.swapEdgesId
    id1: elementId
    id2: elementId
}

export interface AddGroup extends BaseOperation {
    type: operationType.addGroup
    group: Group
}

export interface RemoveGroup extends BaseOperation {
    type: operationType.removeGroup
    group: Group
}

export interface AddNodeToGroup extends BaseOperation {
    type: operationType.addNodeToGroup
    groupId: elementId
    nodeId: elementId
}

export interface RemoveNodeFromGroup extends BaseOperation {
    type: operationType.removeNodeFromGroup
    groupId: elementId
    nodeId: elementId
}

export interface ChangeGraphName extends BaseOperation {
    type: operationType.changeGraphName
    oldName: string
    newName: string
}

export interface ChangeGroupColoring extends BaseOperation {
    type: operationType.changeGroupColoring
    groupId: elementId
    oldColoring: Coloring
    newColoring: Coloring
}

export interface ChangeGroupExpandedState extends BaseOperation {
    type: operationType.changeGroupExpandedState
    groupId: elementId
    isExpanded: boolean
}

export type Operation =
    | AddNode
    | RemoveNode
    | AddEdge
    | RemoveEdge
    | ChangeEdgeLabel
    | ChangeNodeLabel
    | OverrideNodeLabel
    | ChangeNodeColoring
    | SwapEdgesId
    | SwapNodesId
    | AddGroup
    | RemoveGroup
    | AddNodeToGroup
    | RemoveNodeFromGroup
    | ChangeGroupColoring
    | ChangeGroupExpandedState
    | ChangeGraphName

/**
 * Find the inverse of a given operation
 */
export function inverse(op: Operation): Operation {
    switch (op.type) {
        case operationType.addNode:
            return { type: operationType.removeNode, node: op.node }
        case operationType.removeNode:
            return { type: operationType.addNode, node: op.node }
        case operationType.addEdge:
            return { type: operationType.removeEdge, edge: op.edge }
        case operationType.removeEdge:
            return { type: operationType.addEdge, edge: op.edge }
        case operationType.changeEdgeLabel:
            return {
                type: operationType.changeEdgeLabel,
                edgeId: op.edgeId,
                oldLabel: op.newLabel,
                newLabel: op.oldLabel,
            }
        case operationType.changeNodeLabel:
            return {
                type: operationType.changeNodeLabel,
                nodeId: op.nodeId,
                oldLabel: op.newLabel,
                newLabel: op.oldLabel,
            }
        case operationType.overrideNodeLabel:
            return {
                type: operationType.overrideNodeLabel,
                nodeId: op.nodeId,
                oldLabel: op.newLabel,
                newLabel: op.oldLabel,
            }
        case operationType.changeNodeColoring:
            return {
                type: operationType.changeNodeColoring,
                nodeId: op.nodeId,
                oldColoring: op.newColoring,
                newColoring: op.oldColoring,
            }
        case operationType.swapEdgesId:
            return {
                type: operationType.swapEdgesId,
                id1: op.id2,
                id2: op.id1,
            }
        case operationType.swapNodesId:
            return {
                type: operationType.swapNodesId,
                id1: op.id2,
                id2: op.id1,
            }
        case operationType.addGroup:
            return {
                type: operationType.removeGroup,
                group: op.group,
            }
        case operationType.removeGroup:
            return {
                type: operationType.addGroup,
                group: op.group,
            }
        case operationType.addNodeToGroup:
            return {
                type: operationType.removeNodeFromGroup,
                groupId: op.groupId,
                nodeId: op.nodeId,
            }
        case operationType.removeNodeFromGroup:
            return {
                type: operationType.addNodeToGroup,
                groupId: op.groupId,
                nodeId: op.nodeId,
            }
        case operationType.changeGroupColoring:
            return {
                type: operationType.changeGroupColoring,
                groupId: op.groupId,
                oldColoring: op.newColoring,
                newColoring: op.oldColoring,
            }
        case operationType.changeGroupExpandedState:
            return {
                type: operationType.changeGroupExpandedState,
                groupId: op.groupId,
                isExpanded: !op.isExpanded,
            }
        case operationType.changeGraphName:
            return {
                type: operationType.changeGraphName,
                oldName: op.newName,
                newName: op.oldName,
            }
    }
}

/**
 * Apply a specific operation on a given graph, assuming the operation is valid
 *
 * Note: The method does the given operation and nothing more.
 * For example, if `RemoveNode` is given, no edge will be removed even though they might be invalid.
 */
export function applyRaw(graph: Graph, op: Operation): Graph {
    switch (op.type) {
        case operationType.addNode:
            return {
                ...graph,
                nodes: graph.nodes.insert(op.node),
            }

        case operationType.removeNode:
            return {
                ...graph,
                nodes: graph.nodes.remove(op.node.id),
            }

        case operationType.addEdge:
            return {
                ...graph,
                edges: graph.edges.insert(op.edge),
            }

        case operationType.removeEdge:
            return {
                ...graph,
                edges: graph.edges.remove(op.edge.id),
            }

        case operationType.changeEdgeLabel:
            return {
                ...graph,
                edges: graph.edges.updateOnly([
                    {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ...graph.edges.get(op.edgeId)!,
                        label: op.newLabel,
                    },
                ]),
            }

        case operationType.changeNodeLabel:
            return {
                ...graph,
                nodes: graph.nodes.updateOnly([
                    {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ...graph.nodes.get(op.nodeId)!,
                        label: op.newLabel,
                    },
                ]),
            }

        case operationType.overrideNodeLabel:
            return {
                ...graph,
                nodes: graph.nodes.updateOnly([
                    {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ...graph.nodes.get(op.nodeId)!,
                        overrideLabel: op.newLabel,
                    },
                ]),
            }

        case operationType.changeNodeColoring:
            return {
                ...graph,
                nodes: graph.nodes.updateOnly([
                    {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ...graph.nodes.get(op.nodeId)!,
                        color: op.newColoring,
                    },
                ]),
            }

        case operationType.swapNodesId:
            return {
                ...graph,
                nodes: graph.nodes.swapElements(op.id1, op.id2, (node, newId) => (node.id = newId)),
            }

        case operationType.swapEdgesId:
            return {
                ...graph,
                edges: graph.edges.swapElements(op.id1, op.id2, (edge, newId) => (edge.id = newId)),
            }

        case operationType.addGroup:
            return {
                ...graph,
                groups: graph.groups.insert(op.group),
            }

        case operationType.removeGroup:
            return {
                ...graph,
                groups: graph.groups.remove(op.group.id),
            }

        case operationType.addNodeToGroup: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const group = graph.groups.get(op.groupId)!
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const node = graph.nodes.get(op.nodeId)!
            return {
                ...graph,
                groups: graph.groups.updateOnly([
                    {
                        ...group,
                        nodes: group.nodes.insert(node),
                    },
                ]),
            }
        }
        case operationType.removeNodeFromGroup: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const group = graph.groups.get(op.groupId)!
            return {
                ...graph,
                groups: graph.groups.updateOnly([
                    {
                        ...group,
                        nodes: group.nodes.remove(op.nodeId),
                    },
                ]),
            }
        }
        case operationType.changeGroupColoring: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const group = graph.groups.get(op.groupId)!
            return {
                ...graph,
                groups: graph.groups.updateOnly([
                    {
                        ...group,
                        coloring: op.newColoring,
                    },
                ]),
            }
        }
        case operationType.changeGroupExpandedState: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const group = graph.groups.get(op.groupId)!
            return {
                ...graph,
                groups: graph.groups.updateOnly([
                    {
                        ...group,
                        isExpanded: op.isExpanded,
                    },
                ]),
            }
        }
        case operationType.changeGraphName:
            return {
                ...graph,
                name: op.newName,
            }
    }
}

/**
 * Tries to apply the given operation on the given graph.
 *
 * Unlike `applyRaw`, this will perform related operations to preserve graph consistency.
 * For example, when removing node, will try to remove all the linked edges as well.
 *
 * @returns The new graph after apply the operation, and the list of micro operations that were actually performed
 */
export function apply(
    graph: Graph,
    op: Operation
): [newGraph: Graph, microOps: readonly Operation[]] {
    switch (op.type) {
        case operationType.removeGroup: {
            const removedGroupId = op.group.id
            const groupsWithoutRemoved = graph.groups.remove(removedGroupId)
            const [newGraph, microOps] = removeDanglingEdgesAndComments(
                {
                    ...graph,
                    groups: groupsWithoutRemoved,
                },
                removedGroupId
            )

            return [newGraph, [op, ...microOps]]
        }
        case operationType.removeNode: {
            const removedNodeId = op.node.id
            const nodesWithoutRemoved = graph.nodes.remove(removedNodeId)
            const [newGraph, microOps] = removeDanglingEdgesAndComments(
                {
                    ...graph,
                    nodes: nodesWithoutRemoved,
                },
                removedNodeId
            )

            return [newGraph, [op, ...microOps]]
        }
        case operationType.removeEdge:
        case operationType.addNode:
        case operationType.addEdge:
        case operationType.changeEdgeLabel:
        case operationType.changeNodeLabel:
        case operationType.overrideNodeLabel:
        case operationType.changeNodeColoring:
        case operationType.swapNodesId:
        case operationType.swapEdgesId:
        case operationType.addGroup:
        case operationType.addNodeToGroup:
        case operationType.removeNodeFromGroup:
        case operationType.changeGroupExpandedState:
        case operationType.changeGroupColoring:
        case operationType.changeGraphName:
            return [applyRaw(graph, op), [op]]
    }
}

function removeDanglingEdgesAndComments(
    graph: Graph,
    removedSideId: elementId
): [newGraph: Graph, microOps: readonly Operation[]] {
    // Find all edges to remove
    const removedEdges = graph.edges
        .filter((edge) => edge.source.id === removedSideId || edge.dest.id === removedSideId)
        .toArray()
    // Update micro operations with removal of all the edges
    let ops: Operation[] = removedEdges.map((edge) => ({ type: operationType.removeEdge, edge }))
    // Remove the edges
    const newEdges = graph.edges.removeAll(removedEdges.map((edge) => edge.id))
    // Check if the target is a comment, if it is remove it
    const commentNodesToRemove = removedEdges
        .filter((edge) => edge.dest.type == elementType.node && edge.dest.extraProperties.isComment)
        .map((edge) => edge.dest)

    if (commentNodesToRemove.length === 0) {
        return [
            {
                ...graph,
                edges: newEdges,
            },
            ops,
        ]
    } else {
        //'Remove comment nodes
        const newNodes = graph.nodes.removeAll(commentNodesToRemove.map((node) => node.id))
        // Update micro operations with removal of comment nodes
        ops = [
            ...ops,
            ...commentNodesToRemove.map(
                (node) => ({ type: operationType.removeNode, node }) as RemoveNode
            ),
        ]
        return [
            {
                ...graph,
                nodes: newNodes,
                edges: newEdges,
            },
            ops,
        ]
    }
}
