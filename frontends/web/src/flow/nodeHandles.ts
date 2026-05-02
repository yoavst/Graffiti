/** Ids for `<Handle id=…>` on code / markdown / comment nodes — used by GraphCanvas edges. */
export const HANDLE = {
  srcT: 'src-t',
  srcR: 'src-r',
  srcB: 'src-b',
  srcL: 'src-l',
  tgtT: 'tgt-t',
  tgtR: 'tgt-r',
  tgtB: 'tgt-b',
  tgtL: 'tgt-l',
} as const;

export type NodeBox = { x: number; y: number; width: number; height: number };

/** Side-first routing when the edge target is a comment (lateral vs vertical from centers). */
export function handlesForEdgeToComment(
  fromId: number,
  toId: number,
  positions: Map<number, NodeBox>,
): { sourceHandle: string; targetHandle: string } | undefined {
  const sp = positions.get(fromId);
  const tp = positions.get(toId);
  if (!sp || !tp) return undefined;
  const scx = sp.x + sp.width / 2;
  const scy = sp.y + sp.height / 2;
  const tcx = tp.x + tp.width / 2;
  const tcy = tp.y + tp.height / 2;
  const dx = tcx - scx;
  const dy = tcy - scy;
  // Prefer lateral handles unless vertical offset clearly dominates. A strict
  // |dx| >= |dy| rule picked top/bottom for comments slightly below the
  // source but mostly to the side, producing a short stub instead of a
  // horizontal run to the comment box.
  const preferHorizontal = Math.abs(dx) * 1.2 >= Math.abs(dy);
  if (preferHorizontal) {
    return dx > 0
      ? { sourceHandle: HANDLE.srcR, targetHandle: HANDLE.tgtL }
      : { sourceHandle: HANDLE.srcL, targetHandle: HANDLE.tgtR };
  }
  return dy > 0
    ? { sourceHandle: HANDLE.srcB, targetHandle: HANDLE.tgtT }
    : { sourceHandle: HANDLE.srcT, targetHandle: HANDLE.tgtB };
}
