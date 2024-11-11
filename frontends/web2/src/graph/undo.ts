import { List } from 'immutable'
import {
    Operation,
    inverse,
    apply as applyOperationGraph,
    applyRaw as applyRawOperationGraph,
} from './operations'
import { Graph } from './types'

export interface GraphWithUndo {
    current: Graph
    undo: List<readonly Operation[]>
    redo: List<readonly Operation[]>
}

export function apply(
    graphStack: GraphWithUndo,
    ...operations: readonly Operation[]
): GraphWithUndo {
    let microOps: Operation[] = []
    let graph = graphStack.current
    for (const operation of operations) {
        const [newGraph, performedOps] = applyOperationGraph(graph, operation)
        graph = newGraph
        microOps = [...microOps, ...performedOps]
    }

    return {
        current: graph,
        undo: graphStack.undo.push(microOps.map(inverse).reverse()),
        redo: List(),
    }
}

export function undo(graphStack: GraphWithUndo): GraphWithUndo {
    const microOps = graphStack.undo.last()
    if (microOps === undefined) {
        throw new Error('Nothing to undo')
    }

    const newGraph = microOps.reduce(applyRawOperationGraph, graphStack.current)

    return {
        current: newGraph,
        undo: graphStack.undo.pop(),
        redo: graphStack.redo.push(microOps.map(inverse).reverse()),
    }
}

export function redo(graphStack: GraphWithUndo): GraphWithUndo {
    const microOps = graphStack.redo.last()
    if (microOps === undefined) {
        throw new Error('Nothing to redo')
    }

    const newGraph = microOps.reduce(applyRawOperationGraph, graphStack.current)

    return {
        current: newGraph,
        undo: graphStack.undo.push(microOps.map(inverse).reverse()),
        redo: graphStack.redo.pop(),
    }
}
