import type { GEdge, GNode } from '../model';

export interface LayoutInputNode {
  id: number;
  width: number;
  height: number;
  isComment?: boolean;
}

export interface LayoutInputEdge {
  id: number;
  from: number;
  to: number;
}

export interface LayoutOptions {
  engine: 'elk' | 'dagre';
  curved: boolean;
}

export interface LayoutPosition {
  id: number;
  x: number;
  y: number;
}

export interface LayoutResult {
  positions: LayoutPosition[];
  width: number;
  height: number;
}

// Measure text accurately so ELK doesn't pack nodes on top of each other.
// We use canvas.measureText with the same font stack as our node CSS.
const FONT = '500 14px ui-sans-serif, system-ui, -apple-system, sans-serif';
const NODE_MAX_WIDTH = 520;
const NODE_MIN_WIDTH = 100;
// 12px (px-3) + 12px (px-3) + 2px + 2px (border-2) on each axis.
const NODE_PADDING_X = 28;
const NODE_PADDING_Y = 20;
// text-sm line-height = 1.25rem = 20px.
const LINE_HEIGHT = 20;

let _ctx: CanvasRenderingContext2D | null = null;
function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (_ctx) return _ctx;
  const canvas = document.createElement('canvas');
  _ctx = canvas.getContext('2d');
  if (_ctx) _ctx.font = FONT;
  return _ctx;
}

function measureNode(label: string): { width: number; height: number } {
  const ctx = getCtx();
  const lines = label.split('\n');
  let maxLine = 0;
  if (ctx) {
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxLine) maxLine = w;
    }
  } else {
    maxLine = label.length * 8;
  }
  const widthRaw = Math.ceil(maxLine) + NODE_PADDING_X;
  const width = Math.max(NODE_MIN_WIDTH, Math.min(NODE_MAX_WIDTH, widthRaw));
  // If clamped, the text wraps across multiple visual lines.
  const visualLines =
    widthRaw > NODE_MAX_WIDTH
      ? Math.ceil(widthRaw / (NODE_MAX_WIDTH - NODE_PADDING_X))
      : lines.length;
  const height = NODE_PADDING_Y + visualLines * LINE_HEIGHT;
  return { width, height };
}

export function nodesToInput(nodes: GNode[]): LayoutInputNode[] {
  return nodes.map((n) => {
    const label = n.overrideLabel ?? n.label ?? '';
    const { width, height } = measureNode(label);
    return {
      id: n.id,
      width,
      height,
      isComment: !!n.extra.isComment,
    };
  });
}

export function edgesToInput(edges: GEdge[]): LayoutInputEdge[] {
  return edges.map((e) => ({ id: e.id, from: e.from, to: e.to }));
}
