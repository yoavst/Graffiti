import type { GraphDoc } from '@/graph/model';

export interface WorkspaceRow {
  id: string;
  name: string;
  color?: string;
  defaultLayout?: 'elk' | 'dagre';
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface TabGroupRow {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  collapsed: boolean;
  orderIndex: number;
}

export interface TabRow {
  id: string;
  tabGroupId: string;
  name: string;
  layout: 'elk' | 'dagre';
  notes?: string;
  pendingNodeTheme?: number;
  orderIndex: number;
  updatedAt: number;
}

/** Serialized workspace slice: metadata + nested groups/tabs (graph docs live under `graphStorageKey(tabId)`). */
export interface WorkspaceBundle {
  workspace: WorkspaceRow;
  groups: TabGroupRow[];
  tabs: TabRow[];
}

export const TAB_COLORS = [
  '#7e57c2',
  '#26a69a',
  '#ef5350',
  '#ffa726',
  '#42a5f5',
  '#66bb6a',
  '#ab47bc',
  '#8d6e63',
];

export function pickColor(seed: number): string {
  return TAB_COLORS[Math.abs(seed) % TAB_COLORS.length]!;
}

export function emptyGraphDoc(): GraphDoc {
  return { idCounter: 1, nodes: [], edges: [], config: {} };
}
