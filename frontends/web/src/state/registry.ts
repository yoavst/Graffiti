// A small singleton that maps tabId -> live runtime + actions, so the
// websocket dispatcher (and command palette) can target tabs without
// going through React. The active tab id is always `activeTabIdAtom` in Jotai
// (pane-aware); resolve it with `useAtomValue` in React or `getActiveTabFromStore(store)` elsewhere.

import type { TabActions, TabRuntime } from './graph';
import type { JotaiStore } from './store';
import { activeTabIdAtom } from './workspaces';

const runtimes = new Map<string, { rt: TabRuntime; actions: TabActions; refcount: number }>();

export function registerTab(tabId: string, rt: TabRuntime, actions: TabActions) {
  const cur = runtimes.get(tabId);
  if (cur) {
    cur.refcount += 1;
    cur.rt = rt;
    cur.actions = actions;
  } else {
    runtimes.set(tabId, { rt, actions, refcount: 1 });
  }
}

export function unregisterTab(tabId: string) {
  const cur = runtimes.get(tabId);
  if (!cur) return;
  cur.refcount -= 1;
  if (cur.refcount <= 0) runtimes.delete(tabId);
}

export function getTab(tabId: string) {
  const e = runtimes.get(tabId);
  return e ? { rt: e.rt, actions: e.actions } : null;
}

export function getTabFull(tabId: string) {
  const e = runtimes.get(tabId);
  return e ? { tabId, rt: e.rt, actions: e.actions } : null;
}

/** Non-React entry: read `activeTabIdAtom` from `store`, then the live registry row. */
export function getActiveTabFromStore(store: JotaiStore) {
  const id = store.get(activeTabIdAtom);
  if (id == null) return null;
  return getTabFull(id);
}
