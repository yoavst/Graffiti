// A small singleton that maps tabId -> live runtime + actions, so the
// websocket dispatcher (and command palette) can target tabs without
// going through React.

import type { TabActions, TabRuntime } from './graph';

const runtimes = new Map<string, { rt: TabRuntime; actions: TabActions; refcount: number }>();
let currentTabId: string | null = null;

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

export function setCurrentTab(tabId: string | null) {
  currentTabId = tabId;
}

export function getCurrentTab() {
  if (currentTabId == null) return null;
  const e = runtimes.get(currentTabId);
  return e ? { tabId: currentTabId, ...e } : null;
}

export function getTabFull(tabId: string) {
  const e = runtimes.get(tabId);
  return e ? { tabId, rt: e.rt, actions: e.actions } : null;
}
