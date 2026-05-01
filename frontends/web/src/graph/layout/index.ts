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

/** Build a structural hash so we can skip layout when only label/theme changed. */
export function structuralHash(nodes: GNode[], edges: GEdge[]): string {
  const ns = nodes.map((n) => n.id).sort((a, b) => a - b).join(',');
  const es = edges.map((e) => `${e.from}-${e.to}-${e.id}`).sort().join(';');
  return `n:${ns}|e:${es}`;
}
