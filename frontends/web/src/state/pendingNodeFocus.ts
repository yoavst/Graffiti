import { atom } from 'jotai';
import type { JotaiStore } from '@/state/store';

export type FlowPane = 'primary' | 'side';

export type PendingNodeFocus = {
  tabId: string;
  pane: FlowPane;
  nodeId: number;
  token: number;
};

let nextToken = 0;

/** Latest programmatic jump — only the matching `GraphCanvas` should select + fit, then clear. */
export const pendingNodeFocusAtom = atom<PendingNodeFocus | null>(null);

export function enqueuePendingNodeFocus(
  store: JotaiStore,
  tabId: string,
  nodeId: number,
  pane: FlowPane,
): void {
  nextToken += 1;
  store.set(pendingNodeFocusAtom, { tabId, pane, nodeId, token: nextToken });
}
