// Imperative fit for the canvas in a given split pane (tab + pane disambiguates
// when the same tab is open in primary and side). Hotkeys use this; the canvas
// fit control calls the same registered callback as the Home key.

import type { FlowPane } from '@/state/pendingNodeFocus';

function registryKey(tabId: string, pane: FlowPane) {
  return `${tabId}:${pane}`;
}

const callbacks = new Map<string, () => void>();

export function registerFlowFitView(tabId: string, pane: FlowPane, fn: (() => void) | null) {
  const k = registryKey(tabId, pane);
  if (fn) callbacks.set(k, fn);
  else callbacks.delete(k);
}

export function requestFitViewForTab(tabId: string, pane: FlowPane) {
  callbacks.get(registryKey(tabId, pane))?.();
}
