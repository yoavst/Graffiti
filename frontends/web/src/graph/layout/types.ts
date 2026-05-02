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

// Canvas metrics mirror CodeNode / MarkdownNode / CommentNode (Tailwind
// text-sm / text-xs, padding, border) so ELK/Dagre sizes match what React
// renders — otherwise edges miss handles and nodes look over-wide when text
// wraps inside maxWidth.

const FONT_CODE = '500 14px ui-sans-serif, system-ui, -apple-system, sans-serif';
const FONT_MARKDOWN = '400 14px ui-sans-serif, system-ui, -apple-system, sans-serif';
const FONT_COMMENT = 'italic 12px ui-sans-serif, system-ui, -apple-system, sans-serif';

const OUTER_MAX_CODE = 520;
const OUTER_MAX_COMMENT = 320;
const OUTER_MIN = 100;

// px-3 (12+12) + border 2+2 on each horizontal side.
const PAD_X = 28;
// py-2 (8+8) + border 2+2 on each vertical side.
const PAD_Y = 20;

const LINE_CODE = 20;
const LINE_COMMENT = 17;

let _ctx: CanvasRenderingContext2D | null = null;
function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (_ctx) return _ctx;
  const canvas = document.createElement('canvas');
  _ctx = canvas.getContext('2d');
  return _ctx;
}

function makeMeasure(font: string): (s: string) => number {
  const ctx = getCtx();
  return (s: string) => {
    if (!ctx) return s.length * 7;
    ctx.font = font;
    return ctx.measureText(s).width;
  };
}

function wrapParagraph(paragraph: string, maxContentW: number, measure: (s: string) => number): string[] {
  if (maxContentW < 4) return [''];
  const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (measure(trial) <= maxContentW) {
      current = trial;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
    }
    if (measure(word) <= maxContentW) {
      current = word;
      continue;
    }
    let piece = '';
    for (const ch of word) {
      const grow = piece + ch;
      if (measure(grow) <= maxContentW) {
        piece = grow;
      } else {
        if (piece) lines.push(piece);
        piece = ch;
      }
    }
    current = piece;
  }
  if (current) lines.push(current);
  return lines;
}

/** Split on explicit newlines, wrap each block to max content width (exported for tests). */
export function wrapLabelLines(label: string, maxContentW: number, measure: (s: string) => number): string[] {
  const blocks = label.split('\n');
  const out: string[] = [];
  for (const block of blocks) {
    if (block === '') out.push('');
    else out.push(...wrapParagraph(block, maxContentW, measure));
  }
  return out.length > 0 ? out : [''];
}

function measureWrappedNode(
  label: string,
  opts: { font: string; outerMax: number; lineHeight: number },
): { width: number; height: number } {
  const measure = makeMeasure(opts.font);
  const maxContent = opts.outerMax - PAD_X;
  const lines = wrapLabelLines(label, maxContent, measure);
  let maxLine = 0;
  for (const ln of lines) {
    maxLine = Math.max(maxLine, measure(ln));
  }
  const widthRaw = Math.ceil(maxLine) + PAD_X;
  const width = Math.max(OUTER_MIN, Math.min(opts.outerMax, widthRaw));
  const height = PAD_Y + lines.length * opts.lineHeight;
  return { width, height };
}

function measureForGraphNode(n: GNode): { width: number; height: number } {
  const text = n.overrideLabel ?? n.label ?? '';
  if (n.extra.isComment) {
    return measureWrappedNode(text, {
      font: FONT_COMMENT,
      outerMax: OUTER_MAX_COMMENT,
      lineHeight: LINE_COMMENT,
    });
  }
  if (n.extra.isMarkdown) {
    return measureWrappedNode(text, {
      font: FONT_MARKDOWN,
      outerMax: OUTER_MAX_CODE,
      lineHeight: LINE_CODE,
    });
  }
  return measureWrappedNode(text, {
    font: FONT_CODE,
    outerMax: OUTER_MAX_CODE,
    lineHeight: LINE_CODE,
  });
}

export function nodesToInput(nodes: GNode[]): LayoutInputNode[] {
  return nodes.map((n) => {
    const { width, height } = measureForGraphNode(n);
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
