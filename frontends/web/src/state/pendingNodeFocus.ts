import { atom } from 'jotai';
import type { JotaiStore } from '@/state/store';

export type FlowPane = 'primary' | 'side';

export type PendingNodeFocus = {
  graphId: string;
  pane: FlowPane;
  nodeId: number;
  token: number;
};

let nextToken = 0;

/** Latest programmatic jump — only the matching `GraphCanvas` should select + fit, then clear. */
export const pendingNodeFocusAtom = atom<PendingNodeFocus | null>(null);

export function enqueuePendingNodeFocus(
  store: JotaiStore,
  graphId: string,
  nodeId: number,
  pane: FlowPane,
): void {
  nextToken += 1;
  store.set(pendingNodeFocusAtom, { graphId, pane, nodeId, token: nextToken });
}
