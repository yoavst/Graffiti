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
  theme?: number; // index into THEMES (or undefined for auto)
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
  pendingNodeTheme?: number | 'auto';
  viewport?: { x: number; y: number; zoom: number };
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
