// Imperative fit for the canvas in a given split pane (graph + pane disambiguates
// when the same graph is open in primary and side). Hotkeys use this; the canvas
// fit control calls the same registered callback as the Home key.

import type { FlowPane } from '@/state/pendingNodeFocus';

function registryKey(graphId: string, pane: FlowPane) {
  return `${graphId}:${pane}`;
}

const callbacks = new Map<string, () => void>();

export function registerFlowFitView(graphId: string, pane: FlowPane, fn: (() => void) | null) {
  const k = registryKey(graphId, pane);
  if (fn) callbacks.set(k, fn);
  else callbacks.delete(k);
}

export function requestFitViewForGraph(graphId: string, pane: FlowPane) {
  callbacks.get(registryKey(graphId, pane))?.();
}
