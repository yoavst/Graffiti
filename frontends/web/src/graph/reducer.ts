// Pure reducer for graph mutations + inverse-op tracking for undo/redo.
// Each `apply*` function returns the inverse op so callers can push it
// onto a per-graph history stack. A history "marker" groups multi-op
// transactions into a single undo step (matches the legacy semantics).

import type {
  ArrowKind,
  EdgeStyle,
  GEdge,
  GNode,
  GraphConfig,
  GraphDoc,
} from './model';
import { applyComputedProperties } from './computedProperties';
import {
  matchesSelection,
  type SelectionV1,
  type SelectionV2,
} from '@/network/protocol/selection';

// --------------------------------------------------------------------------
// Op tagged union — both for forward ops (applied via `apply`) and inverse
// ops (returned by `apply` for the history stack). Ops are JSON-safe.
// --------------------------------------------------------------------------

export type Op =
  | { type: 'addNode'; data: GNode }
  | { type: 'removeNode'; data: GNode }
  | { type: 'addEdge'; data: GEdge }
  | { type: 'removeEdge'; data: GEdge }
  | { type: 'setNodeLabel'; id: number; oldLabel: string; newLabel: string }
  | { type: 'setOverrideLabel'; id: number; oldLabel: string | undefined; newLabel: string | undefined }
  | { type: 'setNodeTheme'; id: number; oldTheme: number | undefined; newTheme: number | undefined }
  | { type: 'setExtra'; id: number; key: string; oldValue: unknown; newValue: unknown }
  | { type: 'removeExtra'; id: number; key: string; oldValue: unknown }
  | { type: 'setEdgeLabel'; id: number; oldLabel: string | undefined; newLabel: string | undefined }
  | { type: 'setEdgeArrow'; id: number; oldArrow: ArrowKind | undefined; newArrow: ArrowKind | undefined }
  | { type: 'setEdgeStyle'; id: number; oldStyle: EdgeStyle | undefined; newStyle: EdgeStyle | undefined }
  | { type: 'swapEdges'; id1: number; id2: number }
  | { type: 'swapIds'; id1: number; id2: number }
  | { type: 'setConfig'; oldConfig: GraphConfig | undefined; newConfig: GraphConfig | undefined };

export const HISTORY_MARKER = '__marker__' as const;
export type HistoryEntry = Op | typeof HISTORY_MARKER;

// --------------------------------------------------------------------------
// Mutation helpers (operate on the doc in-place; return inverse ops).
// --------------------------------------------------------------------------

export function applyOp(doc: GraphDoc, op: Op): Op {
  switch (op.type) {
    case 'addNode': {
      doc.nodes.push(op.data);
      return { type: 'removeNode', data: op.data };
    }
    case 'removeNode': {
      const idx = doc.nodes.findIndex((n) => n.id === op.data.id);
      if (idx >= 0) doc.nodes.splice(idx, 1);
      return { type: 'addNode', data: op.data };
    }
    case 'addEdge': {
      doc.edges.push(op.data);
      return { type: 'removeEdge', data: op.data };
    }
    case 'removeEdge': {
      const idx = doc.edges.findIndex((e) => e.id === op.data.id);
      if (idx >= 0) doc.edges.splice(idx, 1);
      return { type: 'addEdge', data: op.data };
    }
    case 'setNodeLabel': {
      const node = doc.nodes.find((n) => n.id === op.id);
      if (!node) return op;
      node.label = op.newLabel;
      return { type: 'setNodeLabel', id: op.id, oldLabel: op.newLabel, newLabel: op.oldLabel };
    }
    case 'setOverrideLabel': {
      const node = doc.nodes.find((n) => n.id === op.id);
      if (!node) return op;
      if (op.newLabel === undefined) delete node.overrideLabel;
      else node.overrideLabel = op.newLabel;
      return {
        type: 'setOverrideLabel',
        id: op.id,
        oldLabel: op.newLabel,
        newLabel: op.oldLabel,
      };
    }
    case 'setNodeTheme': {
      const node = doc.nodes.find((n) => n.id === op.id);
      if (!node) return op;
      if (op.newTheme === undefined) delete node.theme;
      else node.theme = op.newTheme;
      return {
        type: 'setNodeTheme',
        id: op.id,
        oldTheme: op.newTheme,
        newTheme: op.oldTheme,
      };
    }
    case 'setExtra': {
      const node = doc.nodes.find((n) => n.id === op.id);
      if (!node) return op;
      const old = (node.extra as Record<string, unknown>)[op.key];
      (node.extra as Record<string, unknown>)[op.key] = op.newValue;
      applyComputedProperties(node.extra);
      node.label = (node.extra as Record<string, unknown>).label as string ?? node.label;
      return { type: 'setExtra', id: op.id, key: op.key, oldValue: op.newValue, newValue: old };
    }
    case 'removeExtra': {
      const node = doc.nodes.find((n) => n.id === op.id);
      if (!node) return op;
      const old = (node.extra as Record<string, unknown>)[op.key];
      delete (node.extra as Record<string, unknown>)[op.key];
      applyComputedProperties(node.extra);
      return { type: 'setExtra', id: op.id, key: op.key, oldValue: undefined, newValue: old };
    }
    case 'setEdgeLabel': {
      const edge = doc.edges.find((e) => e.id === op.id);
      if (!edge) return op;
      if (op.newLabel === undefined || op.newLabel === '') delete edge.label;
      else edge.label = op.newLabel;
      return {
        type: 'setEdgeLabel',
        id: op.id,
        oldLabel: op.newLabel,
        newLabel: op.oldLabel,
      };
    }
    case 'setEdgeArrow': {
      const edge = doc.edges.find((e) => e.id === op.id);
      if (!edge) return op;
      if (op.newArrow === undefined) delete edge.arrow;
      else edge.arrow = op.newArrow;
      return {
        type: 'setEdgeArrow',
        id: op.id,
        oldArrow: op.newArrow,
        newArrow: op.oldArrow,
      };
    }
    case 'setEdgeStyle': {
      const edge = doc.edges.find((e) => e.id === op.id);
      if (!edge) return op;
      if (op.newStyle === undefined) delete edge.style;
      else edge.style = op.newStyle;
      return {
        type: 'setEdgeStyle',
        id: op.id,
        oldStyle: op.newStyle,
        newStyle: op.oldStyle,
      };
    }
    case 'swapEdges': {
      const i = doc.edges.findIndex((e) => e.id === op.id1);
      const j = doc.edges.findIndex((e) => e.id === op.id2);
      if (i < 0 || j < 0) return op;
      const a = doc.edges[i]!;
      const b = doc.edges[j]!;
      doc.edges[i] = { ...b, id: a.id };
      doc.edges[j] = { ...a, id: b.id };
      return { type: 'swapEdges', id1: op.id1, id2: op.id2 };
    }
    case 'swapIds': {
      swapIdsInPlace(doc, op.id1, op.id2);
      return { type: 'swapIds', id1: op.id1, id2: op.id2 };
    }
    case 'setConfig': {
      const old = doc.config;
      doc.config = op.newConfig;
      return { type: 'setConfig', oldConfig: op.newConfig, newConfig: old };
    }
  }
}

function swapIdsInPlace(doc: GraphDoc, id1: number, id2: number) {
  const swap = (id: number) => (id === id1 ? id2 : id === id2 ? id1 : id);
  doc.nodes = doc.nodes.map((n) => ({ ...n, id: swap(n.id) }));
  doc.edges = doc.edges.map((e) => ({ ...e, from: swap(e.from), to: swap(e.to) }));
}

// --------------------------------------------------------------------------
// Higher-level helpers
// --------------------------------------------------------------------------

export function makeGraphDoc(): GraphDoc {
  return { idCounter: 1, nodes: [], edges: [], config: {} };
}

export function nextId(doc: GraphDoc): number {
  const id = doc.idCounter;
  doc.idCounter += 1;
  return id;
}

export function findNode(doc: GraphDoc, id: number): GNode | undefined {
  return doc.nodes.find((n) => n.id === id);
}

export function findNodeByExtra(
  doc: GraphDoc,
  key: string,
  value: unknown,
): GNode | undefined {
  return doc.nodes.find((n) => (n.extra as Record<string, unknown>)[key] === value);
}

export function queryNodes(
  doc: GraphDoc,
  selection: SelectionV1 | SelectionV2,
  version: 1 | 2,
): GNode[] {
  return doc.nodes.filter((n) => matchesSelection(n.extra, selection, version));
}

/**
 * Compute the descendant set (DAG-aware, cycle-safe) of a starting node id,
 * walking only outgoing edges. Mirrors legacy deleteSubtree.
 */
export function descendants(doc: GraphDoc, startId: number): Set<number> {
  const adj = new Map<number, Set<number>>();
  for (const n of doc.nodes) adj.set(n.id, new Set());
  for (const e of doc.edges) adj.get(e.from)?.add(e.to);

  const visited = new Set<number>();
  const recStack = new Set<number>();
  const out = new Set<number>();
  const stack: number[] = [startId];

  // Iterative DFS to avoid blowing the call stack on large graphs.
  function dfs(start: number) {
    const work: Array<{ node: number; phase: 'enter' | 'exit' }> = [{ node: start, phase: 'enter' }];
    while (work.length) {
      const top = work[work.length - 1]!;
      if (top.phase === 'enter') {
        if (visited.has(top.node)) {
          work.pop();
          continue;
        }
        visited.add(top.node);
        recStack.add(top.node);
        out.add(top.node);
        top.phase = 'exit';
        for (const nbr of adj.get(top.node) ?? []) {
          if (!recStack.has(nbr)) work.push({ node: nbr, phase: 'enter' });
        }
      } else {
        recStack.delete(top.node);
        work.pop();
      }
    }
  }

  void stack;
  dfs(startId);
  return out;
}

/**
 * Iterate edges connected to a given node.
 */
export function edgesOf(doc: GraphDoc, nodeId: number): GEdge[] {
  return doc.edges.filter((e) => e.from === nodeId || e.to === nodeId);
}

// --------------------------------------------------------------------------
// History
// --------------------------------------------------------------------------

export interface History {
  undo: HistoryEntry[];
  redo: HistoryEntry[];
}

export function makeHistory(): History {
  return { undo: [], redo: [] };
}

/**
 * Push a marker so the next batch of ops becomes a single undo step.
 */
export function pushMarker(history: History) {
  history.undo.push(HISTORY_MARKER);
}

/**
 * Apply an op forward, push the inverse onto undo, and clear redo.
 */
export function applyAndRecord(doc: GraphDoc, history: History, op: Op): Op {
  const inverse = applyOp(doc, op);
  history.undo.push(inverse);
  history.redo = [];
  return inverse;
}

/**
 * Apply many ops as a single undo unit.
 */
export function applyTransaction(doc: GraphDoc, history: History, ops: Op[]) {
  pushMarker(history);
  for (const op of ops) applyAndRecord(doc, history, op);
}

export function undo(doc: GraphDoc, history: History) {
  if (!history.undo.length) return;
  history.redo.push(HISTORY_MARKER);
  while (history.undo.length) {
    const entry = history.undo.pop()!;
    if (entry === HISTORY_MARKER) break;
    const inverse = applyOp(doc, entry);
    history.redo.push(inverse);
  }
}

export function redo(doc: GraphDoc, history: History) {
  if (!history.redo.length) return;
  history.undo.push(HISTORY_MARKER);
  while (history.redo.length) {
    const entry = history.redo.pop()!;
    if (entry === HISTORY_MARKER) break;
    const inverse = applyOp(doc, entry);
    history.undo.push(inverse);
  }
}
