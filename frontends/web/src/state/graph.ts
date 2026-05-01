// Per-tab graph state held in memory: an `atomFamily` keyed by tabId.
// Persistence to Dexie is debounced and runs on idle.

import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { db } from '@/persistence/db';
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

export interface TabRuntime {
  doc: GraphDoc;
  history: History;
  loaded: boolean;
  selectedNodeId: number | null;
  selectedEdgeId: number | null;
}

function emptyRuntime(): TabRuntime {
  return {
    doc: makeGraphDoc(),
    history: makeHistory(),
    loaded: false,
    selectedNodeId: null,
    selectedEdgeId: null,
  };
}

// Per-tab runtime atom (in-memory only; doc is persisted separately).
export const tabRuntimeAtom = atomFamily((_tabId: string) => atom<TabRuntime>(emptyRuntime()));

// "Tick" atom we bump after each mutation so React subscribers re-render.
// We mutate the doc/history in place for performance and bump this counter.
export const tabTickAtom = atomFamily((_tabId: string) => atom(0));

export interface TabActions {
  apply: (op: Op) => Op;
  applyTransaction: (ops: Op[]) => void;
  undo: () => void;
  redo: () => void;
  select: (nodeId: number | null) => void;
  selectEdge: (edgeId: number | null) => void;
  hydrate: () => Promise<void>;
  flush: () => void;
}

const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const PERSIST_DEBOUNCE_MS = 250;

export function makeTabActions(
  tabId: string,
  getRuntime: () => TabRuntime,
  bumpTick: () => void,
): TabActions {
  function schedulePersist() {
    const old = persistTimers.get(tabId);
    if (old) clearTimeout(old);
    const t = setTimeout(() => {
      persistTimers.delete(tabId);
      const rt = getRuntime();
      // structuredClone-ish snapshot to avoid Dexie holding our live doc
      void db.graphs.put({ tabId, doc: snapshotDoc(rt.doc) });
      void db.tabs.update(tabId, { updatedAt: Date.now() });
    }, PERSIST_DEBOUNCE_MS);
    persistTimers.set(tabId, t);
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
      bumpTick();
    },
    selectEdge(edgeId) {
      const rt = getRuntime();
      rt.selectedEdgeId = edgeId;
      rt.selectedNodeId = null;
      bumpTick();
    },
    async hydrate() {
      const rt = getRuntime();
      if (rt.loaded) {
        // Even if already loaded in memory, bump the tick so any newly
        // mounted subscribers re-render with the cached doc.
        bumpTick();
        return;
      }
      try {
        const row = await db.graphs.get(tabId);
        if (row?.doc) {
          rt.doc = row.doc;
        }
      } catch (e) {
        console.error('hydrate failed for tab', tabId, e);
      }
      rt.loaded = true;
      bumpTick();
    },
    flush() {
      const t = persistTimers.get(tabId);
      if (t) {
        clearTimeout(t);
        persistTimers.delete(tabId);
        const rt = getRuntime();
        void db.graphs.put({ tabId, doc: snapshotDoc(rt.doc) });
      }
    },
  };
}

function snapshotDoc(doc: GraphDoc): GraphDoc {
  return JSON.parse(JSON.stringify(doc)) as GraphDoc;
}
