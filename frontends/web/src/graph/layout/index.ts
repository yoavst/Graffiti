// Public layout API. Picks engine and dispatches.

import type { GEdge, GNode } from '../model';
import { edgesToInput, nodesToInput, type LayoutOptions, type LayoutResult } from './types';
import { layoutWithDagre } from './dagre';
import { layoutWithElk } from './elk';

export async function layout(
  nodes: GNode[],
  edges: GEdge[],
  options: LayoutOptions,
): Promise<LayoutResult> {
  if (options.engine === 'dagre') {
    return layoutWithDagre(nodesToInput(nodes), edgesToInput(edges));
  }
  return layoutWithElk(nodesToInput(nodes), edgesToInput(edges), options);
}

/** Hash graph identity + measured node boxes so label edits relayout with new sizes. */
export function structuralHash(nodes: GNode[], edges: GEdge[]): string {
  const inputs = nodesToInput(nodes);
  const ns = [...inputs]
    .sort((a, b) => a.id - b.id)
    .map((i) => `${i.id}:${i.width}x${i.height}`)
    .join(';');
  const es = edges.map((e) => `${e.from}-${e.to}-${e.id}`).sort().join(';');
  return `n:${ns}|e:${es}`;
}
