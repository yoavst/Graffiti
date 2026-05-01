// A small singleton that maps tabId -> live runtime + actions, so the
// websocket dispatcher (and command palette) can target tabs without
// going through React.

import type { TabActions, TabRuntime } from './graph';

const runtimes = new Map<string, { rt: TabRuntime; actions: TabActions }>();
let currentTabId: string | null = null;

export function registerTab(tabId: string, rt: TabRuntime, actions: TabActions) {
  runtimes.set(tabId, { rt, actions });
}

export function unregisterTab(tabId: string) {
  runtimes.delete(tabId);
}

export function getTab(tabId: string) {
  return runtimes.get(tabId) ?? null;
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
  return e ? { tabId, ...e } : null;
}
