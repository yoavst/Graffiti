// Core graph data types. Field names match the legacy on-disk JSON
// (so old `.json` exports still import without translation).

export type ArrowKind = 'normal' | 'dotted' | 'cross' | 'none';

// Whitelist of edge stroke colors, drawn from the same palette as node
// themes so visually-grouped edges match their connected nodes. The
// special 'auto' entry uses the theme's foreground edge color.
export const EDGE_COLORS = [
  { id: 'auto', label: 'Auto', value: undefined as string | undefined },
  { id: 'green', label: 'Green', value: '#A9D18E' },
  { id: 'blue', label: 'Blue', value: '#BDD0E9' },
  { id: 'yellow', label: 'Yellow', value: '#FFE699' },
  { id: 'orange', label: 'Orange', value: '#ED7D31' },
  { id: 'gray', label: 'Gray', value: '#D9D9D9' },
  { id: 'red', label: 'Red', value: '#FF695E' },
  { id: 'pink', label: 'Pink', value: '#FFDDE1' },
  { id: 'purple', label: 'Purple', value: '#9500ae' },
  { id: 'navy', label: 'Navy', value: '#2c387e' },
] as const;

export interface ComputedProperty {
  name: string;
  format: string;
  replacements: string[];
}

export interface NodeExtra {
  // Identity (as sent by IDE backends)
  project?: string;
  address?: string;
  baseAddress?: string;
  baseName?: string;
  line?: string;
  seg?: string;

  // Node flavor flags
  isMarkdown?: boolean;
  isComment?: boolean;
  isUnclickable?: boolean;

  // Hover doc
  hover?: string[];
  hoverCT?: 'markdown' | 'html';
  detail?: string;

  // Computed label support
  computedProperties?: ComputedProperty[];

  // Anything else the backend chooses to attach
  [key: string]: unknown;
}

/** First-class `extra` keys hidden from the inspector's generic property list. */
export const NODE_EXTRA_INSPECTOR_HIDDEN_KEYS: ReadonlySet<string> = new Set([
  'label',
  'isMarkdown',
  'isComment',
  'isUnclickable',
  'hover',
  'hoverCT',
  'detail',
]);

export interface EdgeStyle {
  dashed?: boolean;
  color?: string;
  width?: number;
  curve?: 'smooth' | 'straight' | 'step';
}

export interface GNode {
  id: number;
  label: string;
  overrideLabel?: string;
  theme?: number; // index into THEMES; omission means defaults in getNodeTheme (code → 0)
  extra: NodeExtra;
}

export interface GEdge {
  id: number;
  from: number;
  to: number;
  label?: string;
  arrow?: ArrowKind;
  style?: EdgeStyle;
}

export interface GraphConfig {
  elkRenderer?: boolean;
  notes?: string;
  /** Default palette index for new nodes (0 = first / green). */
  pendingNodeTheme?: number;
  viewport?: { x: number; y: number; zoom: number };
  /** Per-graph legend copy keyed by `EDGE_COLORS` id (`green`, `blue`, …). */
  colorLegend?: Partial<Record<(typeof EDGE_COLORS)[number]['id'], string>>;
}

export interface GraphDoc {
  idCounter: number;
  nodes: GNode[];
  edges: GEdge[];
  config?: GraphConfig;
}

export const THEMES: Array<{ bg: string; fg: string }> = [
  { bg: '#A9D18E', fg: 'black' },
  { bg: '#BDD0E9', fg: 'black' },
  { bg: '#FFE699', fg: 'black' },
  { bg: '#ED7D31', fg: 'black' },
  { bg: '#D9D9D9', fg: 'black' },
  { bg: '#FF695E', fg: 'black' },
  { bg: '#FFDDE1', fg: 'black' },
  { bg: '#9500ae', fg: 'white' },
  { bg: '#2c387e', fg: 'white' },
];

/** Pen color / graph default for new nodes — always a palette index (0 = first / green). */
export function normalizePendingNodeTheme(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const i = Math.trunc(v);
    if (i >= 0 && i < THEMES.length) return i;
  }
  return 0;
}

export const MARKDOWN_THEME = { bg: 'white', fg: 'black', stroke: '#e5e5e5' };
export const COMMENT_THEME = { bg: '#bfbfbf', fg: 'black', stroke: '#858585' };

export function nodeFlavor(node: GNode): 'code' | 'markdown' | 'comment' | 'line' {
  if (node.extra.isComment) return 'comment';
  if (node.extra.isMarkdown) return 'markdown';
  if (node.extra.line !== undefined) return 'line';
  return 'code';
}

export function getNodeTheme(node: GNode): { bg: string; fg: string; stroke?: string } {
  if (node.extra.isMarkdown) {
    if (node.extra.isComment) {
      if (node.theme === undefined || node.theme === 4) return COMMENT_THEME;
      return { ...THEMES[node.theme]!, stroke: undefined };
    }
    if (node.theme === undefined) return MARKDOWN_THEME;
    return { ...THEMES[node.theme]!, stroke: undefined };
  }
  return { ...THEMES[node.theme ?? 0]!, stroke: undefined };
}

export function visibleLabel(node: GNode): string {
  return node.overrideLabel ?? node.label;
}

function normHex(s: string): string {
  return s.trim().toLowerCase();
}

/** Which `EDGE_COLORS` entries appear on at least one node or edge in `doc`. */
export function usedPaletteColorIds(doc: GraphDoc): Set<(typeof EDGE_COLORS)[number]['id']> {
  const used = new Set<(typeof EDGE_COLORS)[number]['id']>();
  const hexToId = new Map<string, (typeof EDGE_COLORS)[number]['id']>();
  for (const c of EDGE_COLORS) {
    if (c.value) hexToId.set(normHex(c.value), c.id);
  }
  for (const e of doc.edges) {
    const col = e.style?.color;
    if (col === undefined || col === '') used.add('auto');
    else {
      const id = hexToId.get(normHex(col));
      if (id) used.add(id);
    }
  }
  for (const n of doc.nodes) {
    const id = hexToId.get(normHex(getNodeTheme(n).bg));
    if (id) used.add(id);
  }
  return used;
}
