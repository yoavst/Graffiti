// One-shot migration of legacy localStorage tabs into Dexie.
// The legacy keys (`__SAVED_DATA`, `__SAVED_DATA_VERSION`, `__SAVED_TAB_INDEX`)
// are LEFT IN PLACE — we just stop reading them after the first run.

import { db, pickColor, type TabRow } from './db';
import type { GraphDoc } from '@/graph/model';
import { newId } from '@/util/ids';

const MIGRATION_FLAG = 'graffiti.migratedToDexie';

export interface MigrationResult {
  imported: boolean;
  workspaceId?: string;
  tabIds?: string[];
}

export async function migrateLegacyIfNeeded(): Promise<MigrationResult> {
  if (localStorage.getItem(MIGRATION_FLAG)) return { imported: false };

  const raw = localStorage.getItem('__SAVED_DATA');
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return { imported: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return { imported: false };
  }
  const version = parseInt(localStorage.getItem('__SAVED_DATA_VERSION') ?? '1', 10) || 1;

  // Reconstruct (name, GraphDoc) pairs.
  const pairs: Array<{ name: string; doc: GraphDoc }> = [];
  if (version === 1) {
    // Whole storage is a single (id, nodes, edges) tuple under the name "untitled".
    const doc = parseInnerDoc(JSON.stringify(parsed));
    if (doc) pairs.push({ name: 'untitled', doc });
  } else {
    // version 2: array of [name, innerJsonString]
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (Array.isArray(entry) && entry.length === 2) {
          const [name, innerStr] = entry as [string, string];
          const doc = parseInnerDoc(innerStr);
          if (doc) pairs.push({ name, doc });
        }
      }
    }
  }

  if (pairs.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return { imported: false };
  }

  const workspaceId = newId();
  const groupId = newId();
  const now = Date.now();

  const tabRows: TabRow[] = pairs.map((p, i) => ({
    id: newId(),
    tabGroupId: groupId,
    name: p.name,
    layout: p.doc.config?.elkRenderer === false ? 'dagre' : 'elk',
    notes: p.doc.config?.notes,
    pendingNodeTheme: p.doc.config?.pendingNodeTheme,
    orderIndex: i,
    updatedAt: now,
  }));

  await db.transaction('rw', db.workspaces, db.tabGroups, db.tabs, db.graphs, async () => {
    await db.workspaces.put({
      id: workspaceId,
      name: 'Imported',
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.tabGroups.put({
      id: groupId,
      workspaceId,
      name: 'Default',
      color: pickColor(0),
      collapsed: false,
      orderIndex: 0,
    });
    for (let i = 0; i < tabRows.length; i++) {
      const row = tabRows[i]!;
      const doc = pairs[i]!.doc;
      await db.tabs.put(row);
      await db.graphs.put({ tabId: row.id, doc });
    }
  });

  localStorage.setItem(MIGRATION_FLAG, '1');
  return { imported: true, workspaceId, tabIds: tabRows.map((r) => r.id) };
}

/**
 * Parse the legacy per-tab JSON string `[idCounter, nodes, edges, config?]`.
 */
export function parseInnerDoc(s: string): GraphDoc | null {
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr) || arr.length < 3) return null;
    const [idCounter, nodes, edges, config] = arr as unknown as [
      number,
      GraphDoc['nodes'],
      GraphDoc['edges'],
      GraphDoc['config']?,
    ];
    return {
      idCounter: typeof idCounter === 'number' ? idCounter : 1,
      nodes: nodes ?? [],
      edges: edges ?? [],
      config: config ?? {},
    };
  } catch {
    return null;
  }
}
