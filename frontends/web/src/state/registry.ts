// A small singleton that maps graphId -> live runtime + actions, so the
// websocket dispatcher (and command palette) can target graphs without
// going through React. The active graph id is always `activeGraphIdAtom` in Jotai
// (pane-aware); resolve it with `useAtomValue` in React or `getActiveGraphFromStore(store)` elsewhere.

import type { GraphActions, GraphRuntime } from './graph';
import type { JotaiStore } from './store';
import { activeGraphIdAtom } from './workspaces';

const runtimes = new Map<string, { rt: GraphRuntime; actions: GraphActions; refcount: number }>();

export function registerGraph(graphId: string, rt: GraphRuntime, actions: GraphActions) {
  const cur = runtimes.get(graphId);
  if (cur) {
    cur.refcount += 1;
    cur.rt = rt;
    cur.actions = actions;
  } else {
    runtimes.set(graphId, { rt, actions, refcount: 1 });
  }
}

export function unregisterGraph(graphId: string) {
  const cur = runtimes.get(graphId);
  if (!cur) return;
  cur.refcount -= 1;
  if (cur.refcount <= 0) runtimes.delete(graphId);
}

export function getGraph(graphId: string) {
  const e = runtimes.get(graphId);
  return e ? { rt: e.rt, actions: e.actions } : null;
}

export function getGraphFull(graphId: string) {
  const e = runtimes.get(graphId);
  return e ? { graphId, rt: e.rt, actions: e.actions } : null;
}

/** Non-React entry: read `activeGraphIdAtom` from `store`, then the live registry row. */
export function getActiveGraphFromStore(store: JotaiStore) {
  const id = store.get(activeGraphIdAtom);
  if (id == null) return null;
  return getGraphFull(id);
}
