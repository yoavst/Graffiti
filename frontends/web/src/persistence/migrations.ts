// One-shot migration of the original localStorage tab format (`__SAVED_DATA` / version).
// Does not read IndexedDB; users who only had Dexie data are not migrated here.

import { normalizePendingNodeTheme, type GraphDoc } from '@/graph/model';
import { newId } from '@/util/ids';
import type { JotaiStore } from '@/state/store';
import { workspaceBundleAtomFamily, workspaceIdsAtom } from '@/state/workspaces';
import { pickColor, type TabRow, type WorkspaceBundle } from '@/state/workspaceTypes';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';

/** Set after this migration runs successfully or is skipped as unnecessary. */
const LEGACY_SAVE_MIGRATED_KEY = 'graffiti.migratedLegacySavedState';
/** Historical: marked when the app previously migrated into Dexie; treat as "no __SAVED_DATA import". */
const LEGACY_DEXIE_MARKER = 'graffiti.migratedToDexie';

export interface MigrationResult {
  imported: boolean;
  workspaceId?: string;
  tabIds?: string[];
}

export function migrateLegacyIfNeeded(store: JotaiStore): MigrationResult {
  if (localStorage.getItem(LEGACY_SAVE_MIGRATED_KEY)) return { imported: false };
  if (localStorage.getItem(LEGACY_DEXIE_MARKER)) {
    localStorage.setItem(LEGACY_SAVE_MIGRATED_KEY, '1');
    return { imported: false };
  }

  const raw = localStorage.getItem('__SAVED_DATA');
  if (!raw) {
    localStorage.setItem(LEGACY_SAVE_MIGRATED_KEY, '1');
    return { imported: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.setItem(LEGACY_SAVE_MIGRATED_KEY, '1');
    return { imported: false };
  }
  const version = parseInt(localStorage.getItem('__SAVED_DATA_VERSION') ?? '1', 10) || 1;

  const pairs: Array<{ name: string; doc: GraphDoc }> = [];
  if (version === 1) {
    const doc = parseInnerDoc(JSON.stringify(parsed));
    if (doc) pairs.push({ name: 'untitled', doc });
  } else {
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
    localStorage.setItem(LEGACY_SAVE_MIGRATED_KEY, '1');
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
    pendingNodeTheme: normalizePendingNodeTheme(p.doc.config?.pendingNodeTheme as unknown),
    orderIndex: i,
    updatedAt: now,
  }));

  const bundle: WorkspaceBundle = {
    workspace: {
      id: workspaceId,
      name: 'Imported',
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    },
    groups: [
      {
        id: groupId,
        workspaceId,
        name: 'Default',
        color: pickColor(0),
        collapsed: false,
        orderIndex: 0,
      },
    ],
    tabs: tabRows,
  };

  store.set(workspaceIdsAtom, [workspaceId]);
  store.set(workspaceBundleAtomFamily(workspaceId), bundle);
  for (let i = 0; i < tabRows.length; i++) {
    const row = tabRows[i]!;
    store.set(graphDocAtomFamily(row.id), pairs[i]!.doc);
  }

  localStorage.setItem(LEGACY_SAVE_MIGRATED_KEY, '1');
  return { imported: true, workspaceId, tabIds: tabRows.map((r) => r.id) };
}

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
