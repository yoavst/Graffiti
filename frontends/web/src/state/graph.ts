// Per-graph runtime state held in memory: an `atomFamily` keyed by graphId.
// Graph JSON is persisted via `graphDocAtomFamily` (atomWithStorage).

import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import { touchGraphUpdatedAt } from '@/state/workspaces';
import type { JotaiStore } from '@/state/store';
import {
  applyAndRecord,
  applyTransaction,
  makeGraphDoc,
  makeHistory,
  pushMarker,
  redo as redoFn,
  undo as undoFn,
  type History,
  type Op,
} from '@/graph/reducer';
import type { GraphDoc } from '@/graph/model';

export interface GraphRuntime {
  doc: GraphDoc;
  history: History;
  loaded: boolean;
  selectedNodeId: number | null;
  selectedEdgeId: number | null;
  /** Endpoint opposite the middle-click point on an edge (see LabeledEdge). */
  farHighlightNodeId: number | null;
}

function emptyRuntime(): GraphRuntime {
  return {
    doc: makeGraphDoc(),
    history: makeHistory(),
    loaded: false,
    selectedNodeId: null,
    selectedEdgeId: null,
    farHighlightNodeId: null,
  };
}

// Per-graph runtime atom (in-memory only; doc is persisted separately).
export const graphRuntimeAtom = atomFamily((_: string) => atom<GraphRuntime>(emptyRuntime()));

// "Tick" atom we bump after each mutation so React subscribers re-render.
// We mutate the doc/history in place for performance and bump this counter.
export const graphTickAtom = atomFamily((_: string) => atom(0));

export interface GraphActions {
  apply: (op: Op) => Op;
  applyTransaction: (ops: Op[]) => void;
  undo: () => void;
  redo: () => void;
  select: (nodeId: number | null) => void;
  selectEdge: (edgeId: number | null) => void;
  setFarHighlight: (nodeId: number | null) => void;
  hydrate: () => void;
  flush: () => void;
}

const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const PERSIST_DEBOUNCE_MS = 250;

export function makeGraphActions(
  graphId: string,
  store: JotaiStore,
  getRuntime: () => GraphRuntime,
  bumpTick: () => void,
): GraphActions {
  function persistNow() {
    const rt = getRuntime();
    store.set(graphDocAtomFamily(graphId), snapshotDoc(rt.doc));
    touchGraphUpdatedAt(store, graphId);
  }

  function schedulePersist() {
    const old = persistTimers.get(graphId);
    if (old) clearTimeout(old);
    const t = setTimeout(() => {
      persistTimers.delete(graphId);
      persistNow();
    }, PERSIST_DEBOUNCE_MS);
    persistTimers.set(graphId, t);
  }

  return {
    apply(op) {
      const rt = getRuntime();
      // Treat every single-op apply as its own undo unit. Without this
      // marker, consecutive apply() calls (e.g. add a node via WS, then
      // change its theme via the inspector) all collapse into the previous
      // transaction's undo group, so Ctrl+Z would unwind both at once.
      pushMarker(rt.history);
      const inv = applyAndRecord(rt.doc, rt.history, op);
      bumpTick();
      schedulePersist();
      return inv;
    },
    applyTransaction(ops) {
      const rt = getRuntime();
      applyTransaction(rt.doc, rt.history, ops);
      bumpTick();
      schedulePersist();
    },
    undo() {
      const rt = getRuntime();
      undoFn(rt.doc, rt.history);
      bumpTick();
      schedulePersist();
    },
    redo() {
      const rt = getRuntime();
      redoFn(rt.doc, rt.history);
      bumpTick();
      schedulePersist();
    },
    select(nodeId) {
      const rt = getRuntime();
      rt.selectedNodeId = nodeId;
      rt.selectedEdgeId = null;
      rt.farHighlightNodeId = null;
      bumpTick();
    },
    selectEdge(edgeId) {
      const rt = getRuntime();
      rt.selectedEdgeId = edgeId;
      rt.selectedNodeId = null;
      rt.farHighlightNodeId = null;
      bumpTick();
    },
    setFarHighlight(nodeId) {
      const rt = getRuntime();
      rt.farHighlightNodeId = nodeId;
      bumpTick();
    },
    hydrate() {
      const rt = getRuntime();
      if (rt.loaded) {
        bumpTick();
        return;
      }
      try {
        const doc = store.get(graphDocAtomFamily(graphId));
        rt.doc = snapshotDoc(doc);
      } catch (e) {
        console.error('hydrate failed for graph', graphId, e);
      }
      rt.loaded = true;
      bumpTick();
    },
    flush() {
      const t = persistTimers.get(graphId);
      if (t) {
        clearTimeout(t);
        persistTimers.delete(graphId);
        persistNow();
      }
    },
  };
}

function snapshotDoc(doc: GraphDoc): GraphDoc {
  return JSON.parse(JSON.stringify(doc)) as GraphDoc;
}
