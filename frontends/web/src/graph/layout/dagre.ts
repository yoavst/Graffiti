// Dagre layout — runs synchronously on the main thread (it's fast enough for
// medium graphs and has no async I/O). Used as the alternate engine.

import dagre from '@dagrejs/dagre';
import type { LayoutInputEdge, LayoutInputNode, LayoutResult } from './types';

export function layoutWithDagre(
  nodes: LayoutInputNode[],
  edges: LayoutInputEdge[],
): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 60, edgesep: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) g.setNode(String(n.id), { width: n.width, height: n.height });
  for (const e of edges) g.setEdge(String(e.from), String(e.to));

  dagre.layout(g);

  const positions = nodes.map((n) => {
    const meta = g.node(String(n.id));
    return {
      id: n.id,
      x: meta.x - meta.width / 2,
      y: meta.y - meta.height / 2,
    };
  });

  const graphMeta = g.graph();
  return {
    positions,
    width: graphMeta.width ?? 0,
    height: graphMeta.height ?? 0,
  };
}
