// ELK adapter — runs on the main thread but ELK itself spawns its own
// internal worker, so layout work happens off the main thread already.

import ELK from 'elkjs/lib/elk.bundled.js';
import type {
  LayoutInputEdge,
  LayoutInputNode,
  LayoutOptions,
  LayoutResult,
} from './types';

const elk = new ELK();

export async function layoutWithElk(
  nodes: LayoutInputNode[],
  edges: LayoutInputEdge[],
  options: LayoutOptions,
): Promise<LayoutResult> {
  const layoutOptions: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.direction': 'DOWN',
    // Generous spacing so the arrows and node bodies don't overlap.
    'elk.spacing.nodeNode': '40',
    'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    'elk.layered.spacing.edgeNodeBetweenLayers': '30',
    'elk.spacing.edgeEdge': '15',
    'elk.spacing.edgeNode': '20',
    'org.eclipse.elk.spacing.commentNode': '30',
    'org.eclipse.elk.layered.considerModelOrder.strategy': 'PREFER_EDGES',
    'org.eclipse.elk.padding': '[top=20, left=20, bottom=20, right=20]',
  };
  if (options.curved) layoutOptions['org.eclipse.elk.edgeRouting'] = 'POLYLINE';

  const graph = {
    id: 'root',
    layoutOptions,
    children: nodes.map((n) => ({
      id: String(n.id),
      width: n.width,
      height: n.height,
      ...(n.isComment
        ? { layoutOptions: { 'org.eclipse.elk.commentBox': 'true' } }
        : {}),
    })),
    edges: edges.map((e) => ({
      id: String(e.id),
      sources: [String(e.from)],
      targets: [String(e.to)],
    })),
  };

  const result = await elk.layout(graph);
  const positions = (result.children ?? []).map((c) => ({
    id: parseInt(c.id, 10),
    x: c.x ?? 0,
    y: c.y ?? 0,
  }));
  return {
    positions,
    width: result.width ?? 0,
    height: result.height ?? 0,
  };
}
