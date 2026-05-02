import { atom } from 'jotai';
import { db, type WorkspaceRow, type TabGroupRow, type TabRow, pickColor } from '@/persistence/db';
import { newId } from '@/util/ids';
import { atomWithStorage } from 'jotai/utils';

// --------------------------------------------------------------------------
// Live caches loaded from Dexie at startup, then mutated through helpers
// that also write back to Dexie.
// --------------------------------------------------------------------------

export const workspacesAtom = atom<WorkspaceRow[]>([]);
export const tabGroupsAtom = atom<TabGroupRow[]>([]);
export const tabsAtom = atom<TabRow[]>([]);

export const currentWorkspaceIdAtom = atomWithStorage<string | null>(
  'currentWorkspaceId',
  null,
  undefined,
  { getOnInit: true },
);
export const currentTabIdAtom = atomWithStorage<string | null>('currentTabId', null, undefined, {
  getOnInit: true,
});
export const sidePaneTabIdAtom = atomWithStorage<string | null>('sidePaneTabId', null, undefined, {
  getOnInit: true,
});

// Which split pane is "active" — used by the inspector and global commands so
// they target the pane the user last interacted with rather than always the
// primary one. Resets to 'primary' whenever there is no side pane.
export const activePaneAtom = atom<'primary' | 'side'>('primary');

// --------------------------------------------------------------------------
// Derived selectors
// --------------------------------------------------------------------------

export const currentWorkspaceAtom = atom((get) => {
  const id = get(currentWorkspaceIdAtom);
  return get(workspacesAtom).find((w) => w.id === id) ?? null;
});

export const currentWorkspaceGroupsAtom = atom((get) => {
  const wid = get(currentWorkspaceIdAtom);
  if (!wid) return [];
  return get(tabGroupsAtom)
    .filter((g) => g.workspaceId === wid)
    .sort((a, b) => a.orderIndex - b.orderIndex);
});

export const tabsByGroupAtom = atom((get) => {
  const tabs = get(tabsAtom);
  const out = new Map<string, TabRow[]>();
  for (const t of tabs) {
    const arr = out.get(t.tabGroupId) ?? [];
    arr.push(t);
    out.set(t.tabGroupId, arr);
  }
  for (const arr of out.values()) arr.sort((a, b) => a.orderIndex - b.orderIndex);
  return out;
});

export const currentTabAtom = atom((get) => {
  const id = get(currentTabIdAtom);
  return get(tabsAtom).find((t) => t.id === id) ?? null;
});

export const activeTabIdAtom = atom((get) => {
  const which = get(activePaneAtom);
  if (which === 'side') {
    const id = get(sidePaneTabIdAtom);
    if (id && get(tabsAtom).find((t) => t.id === id)) return id;
  }
  return get(currentTabIdAtom);
});

export const activeTabAtom = atom((get) => {
  const id = get(activeTabIdAtom);
  return get(tabsAtom).find((t) => t.id === id) ?? null;
});

// --------------------------------------------------------------------------
// CRUD helpers — each writes to Dexie then refreshes the atoms.
// --------------------------------------------------------------------------

export async function loadAll(): Promise<{
  workspaces: WorkspaceRow[];
  groups: TabGroupRow[];
  tabs: TabRow[];
}> {
  const [workspaces, groups, tabs] = await Promise.all([
    db.workspaces.orderBy('orderIndex').toArray(),
    db.tabGroups.orderBy('orderIndex').toArray(),
    db.tabs.orderBy('orderIndex').toArray(),
  ]);
  return { workspaces, groups, tabs };
}

/**
 * Clean up empty workspaces (no tab groups). These are usually leftovers
 * from a long-fixed StrictMode race that double-created the default
 * workspace. Safe because we only delete rows that have nothing in them.
 */
export async function pruneEmptyWorkspaces(): Promise<void> {
  const [workspaces, groups] = await Promise.all([
    db.workspaces.toArray(),
    db.tabGroups.toArray(),
  ]);
  if (workspaces.length <= 1) return;
  const usedIds = new Set(groups.map((g) => g.workspaceId));
  const toDelete = workspaces.filter((w) => !usedIds.has(w.id));
  for (const w of toDelete) {
    await db.workspaces.delete(w.id);
  }
}

// Guard against React StrictMode running our boot effect twice in dev: the
// second invocation could race with the first's async DB writes and end up
// creating a second "Default" workspace.
let ensurePromise: Promise<{
  workspaceId: string;
  tabGroupId: string;
  tabId: string;
}> | null = null;

export function ensureDefaultWorkspace() {
  if (!ensurePromise) ensurePromise = ensureDefaultWorkspaceImpl();
  return ensurePromise;
}

async function ensureDefaultWorkspaceImpl(): Promise<{
  workspaceId: string;
  tabGroupId: string;
  tabId: string;
}> {
  const w = await db.workspaces.toArray();
  if (w.length > 0) {
    const ws = w[0]!;
    let group = await db.tabGroups.where('workspaceId').equals(ws.id).first();
    if (!group) {
      group = {
        id: newId(),
        workspaceId: ws.id,
        name: 'Default',
        color: pickColor(0),
        collapsed: false,
        orderIndex: 0,
      };
      await db.tabGroups.put(group);
    }
    let tab = await db.tabs.where('tabGroupId').equals(group.id).first();
    if (!tab) {
      tab = {
        id: newId(),
        tabGroupId: group.id,
        name: 'untitled',
        layout: 'elk',
        orderIndex: 0,
        updatedAt: Date.now(),
      };
      await db.tabs.put(tab);
      await db.graphs.put({
        tabId: tab.id,
        doc: { idCounter: 1, nodes: [], edges: [], config: {} },
      });
    }
    return { workspaceId: ws.id, tabGroupId: group.id, tabId: tab.id };
  }

  const now = Date.now();
  const workspaceId = newId();
  const tabGroupId = newId();
  const tabId = newId();
  await db.workspaces.put({
    id: workspaceId,
    name: 'Default',
    orderIndex: 0,
    createdAt: now,
    updatedAt: now,
  });
  await db.tabGroups.put({
    id: tabGroupId,
    workspaceId,
    name: 'Default',
    color: pickColor(0),
    collapsed: false,
    orderIndex: 0,
  });
  await db.tabs.put({
    id: tabId,
    tabGroupId,
    name: 'untitled',
    layout: 'elk',
    orderIndex: 0,
    updatedAt: now,
  });
  await db.graphs.put({
    tabId,
    doc: { idCounter: 1, nodes: [], edges: [], config: {} },
  });
  return { workspaceId, tabGroupId, tabId };
}
