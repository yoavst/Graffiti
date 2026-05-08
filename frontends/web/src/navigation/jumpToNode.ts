import type { JotaiStore } from '@/state/store';
import { enqueuePendingNodeFocus, type FlowPane } from '@/state/pendingNodeFocus';
import {
  activePaneAtom,
  currentGraphIdAtom,
  sidePaneGraphIdAtom,
} from '@/state/workspaces';

export function resolveTargetPane(graphId: string, store: JotaiStore): FlowPane {
  const primaryGraphId = store.get(currentGraphIdAtom);
  const sideGraphId = store.get(sidePaneGraphIdAtom);
  if (graphId === primaryGraphId && graphId === sideGraphId) return store.get(activePaneAtom);
  if (graphId === primaryGraphId) return 'primary';
  if (graphId === sideGraphId) return 'side';
  return 'primary';
}

export function jumpToNodeInWorkspace(
  graphId: string,
  nodeId: number,
  store: JotaiStore,
  opts?: { openOnPrimary?: boolean },
): void {
  const primary = store.get(currentGraphIdAtom);
  const side = store.get(sidePaneGraphIdAtom);

  // Global search: always primary. Otherwise: switch graph only if it isn't open in either pane.
  const usePrimary =
    opts?.openOnPrimary === true || (graphId !== primary && graphId !== side);

  if (usePrimary) {
    store.set(currentGraphIdAtom, graphId);
    store.set(activePaneAtom, 'primary');
    enqueuePendingNodeFocus(store, graphId, nodeId, 'primary');
    return;
  }

  const pane = resolveTargetPane(graphId, store);
  store.set(activePaneAtom, pane);
  enqueuePendingNodeFocus(store, graphId, nodeId, pane);
}
