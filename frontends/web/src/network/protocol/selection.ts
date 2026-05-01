// Port of #selectionV1 / #selectionV2 from legacy TabController.js
// for the `updateNodes` message.

import type { NodeExtra } from '@/graph/model';

export type SelectionV1 = Array<[string, unknown]>;
export type SelectionV2 = Array<Array<[string, unknown]>>;

function matchAnd(extra: NodeExtra, clauses: Array<[string, unknown]>): boolean {
  for (const [key, value] of clauses) {
    if (!(key in extra)) return false;
    // legacy uses `!=` (loose), preserve that.
    // eslint-disable-next-line eqeqeq
    if ((extra as Record<string, unknown>)[key] != value) return false;
  }
  return true;
}

export function matchesSelection(
  extra: NodeExtra,
  selection: SelectionV1 | SelectionV2,
  version: 1 | 2,
): boolean {
  if (version === 1) {
    return matchAnd(extra, selection as SelectionV1);
  }
  for (const sub of selection as SelectionV2) {
    if (matchAnd(extra, sub)) return true;
  }
  return false;
}
