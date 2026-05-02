import Dexie, { type EntityTable } from 'dexie';
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

export interface GraphRow {
  tabId: string;
  doc: GraphDoc;
  // history is intentionally not persisted; rehydrating undo across reloads
  // is more confusing than useful.
}

export interface SettingsRow {
  key: string;
  value: unknown;
}

export class GraffitiDB extends Dexie {
  workspaces!: EntityTable<WorkspaceRow, 'id'>;
  tabGroups!: EntityTable<TabGroupRow, 'id'>;
  tabs!: EntityTable<TabRow, 'id'>;
  graphs!: EntityTable<GraphRow, 'tabId'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor() {
    super('graffiti');
    this.version(1).stores({
      workspaces: 'id, orderIndex',
      tabGroups: 'id, workspaceId, orderIndex',
      tabs: 'id, tabGroupId, orderIndex',
      graphs: 'tabId',
      settings: 'key',
    });
  }
}

export const db = new GraffitiDB();

export const TAB_COLORS = [
  '#7e57c2', // purple
  '#26a69a', // teal
  '#ef5350', // red
  '#ffa726', // orange
  '#42a5f5', // blue
  '#66bb6a', // green
  '#ab47bc', // magenta
  '#8d6e63', // brown
];

export function pickColor(seed: number): string {
  return TAB_COLORS[Math.abs(seed) % TAB_COLORS.length]!;
}
