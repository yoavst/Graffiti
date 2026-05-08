import type { JotaiStore } from '@/state/store';
import { enqueuePendingNodeFocus, type FlowPane } from '@/state/pendingNodeFocus';
import {
  activePaneAtom,
  currentGraphIdAtom,
  sidePaneGraphIdAtom,
} from '@/state/workspaces';

export function resolveTargetPane(tabId: string, store: JotaiStore): FlowPane {
  const primary = store.get(currentGraphIdAtom);
  const side = store.get(sidePaneGraphIdAtom);
  if (tabId === primary && tabId === side) return store.get(activePaneAtom);
  if (tabId === primary) return 'primary';
  if (tabId === side) return 'side';
  return 'primary';
}

export function jumpToNodeInWorkspace(
  tabId: string,
  nodeId: number,
  store: JotaiStore,
  opts?: { openOnPrimary?: boolean },
): void {
  const primary = store.get(currentGraphIdAtom);
  const side = store.get(sidePaneGraphIdAtom);

  // Global search: always primary. Otherwise: switch tab only if it isn't open in either pane.
  const usePrimary =
    opts?.openOnPrimary === true || (tabId !== primary && tabId !== side);

  if (usePrimary) {
    store.set(currentGraphIdAtom, tabId);
    store.set(activePaneAtom, 'primary');
    enqueuePendingNodeFocus(store, tabId, nodeId, 'primary');
    return;
  }

  const pane = resolveTargetPane(tabId, store);
  store.set(activePaneAtom, pane);
  enqueuePendingNodeFocus(store, tabId, nodeId, pane);
}
