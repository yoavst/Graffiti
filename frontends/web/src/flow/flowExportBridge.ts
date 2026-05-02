// Lets non–React Flow code (Share dialog) snapshot the active tab's canvas:
// temporarily fit the full graph so `onlyRenderVisibleElements` includes every
// node, capture the viewport DOM, then restore pan/zoom.

export type FlowExportBridge = {
  getViewportElement: () => HTMLElement | null;
  /** Fit entire graph for capture; returned function restores the prior viewport. */
  prepareFullGraphSnapshot: () => Promise<() => void>;
};

const bridges = new Map<string, FlowExportBridge>();

export function registerFlowExportBridge(tabId: string, bridge: FlowExportBridge | null) {
  if (bridge) bridges.set(tabId, bridge);
  else bridges.delete(tabId);
}

export function getFlowExportBridge(tabId: string): FlowExportBridge | undefined {
  return bridges.get(tabId);
}
