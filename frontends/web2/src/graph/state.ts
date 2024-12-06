import { dataSetId } from '../utils/DateSet'
import { Operation } from './operations'
import { elementId, Graph, Node } from './types'
import { apply, GraphWithUndo, redo, undo } from './undo'

export class GraphState {
    private readonly graphStack: GraphWithUndo
    readonly currentNode: Node | undefined

    get graph(): Graph {
        return this.graphStack.current
    }

    get maxId(): dataSetId {
        const { nodes, edges, groups } = this.graph
        return Math.max(nodes.maxId, edges.maxId, groups.maxId)
    }

    constructor(graphStack: GraphWithUndo, currentNode: Node | undefined) {
        this.graphStack = graphStack
        this.currentNode = currentNode
    }

    apply(...operations: readonly Operation[]): GraphState {
        const newGraphStack = apply(this.graphStack, ...operations)
        return new GraphState(newGraphStack, newGraphStack.current.nodes.get(this.currentNode?.id))
    }

    setCurrentNode(id: elementId | undefined): GraphState {
        const newCurrentNode = this.graph.nodes.get(id)
        if (newCurrentNode?.id !== this.currentNode?.id) {
            return new GraphState(this.graphStack, newCurrentNode)
        }
        return this
    }

    undo(): GraphState {
        const newGraphStack = undo(this.graphStack)
        return new GraphState(newGraphStack, newGraphStack.current.nodes.get(this.currentNode?.id))
    }

    redo(): GraphState {
        const newGraphStack = redo(this.graphStack)
        return new GraphState(newGraphStack, newGraphStack.current.nodes.get(this.currentNode?.id))
    }
}