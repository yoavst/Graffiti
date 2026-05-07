import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import { normalizePendingNodeTheme } from '@/graph/model';
import { newId } from '@/util/ids';
import type { JotaiStore } from '@/state/store';
import { graphStorageKey, STORAGE_WORKSPACE_IDS, workspaceStorageKey } from '@/state/storageKeys';
import {
  emptyGraphDoc,
  pickColor,
  type TabGroupRow,
  type TabRow,
  type WorkspaceBundle,
} from '@/state/workspaceTypes';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';

// --------------------------------------------------------------------------
// localStorage-backed workspace index + per-workspace bundles
// --------------------------------------------------------------------------

export const workspaceIdsAtom = atomWithStorage<string[]>(STORAGE_WORKSPACE_IDS, [], undefined, {
  getOnInit: true,
});

function defaultBundle(workspaceId: string): WorkspaceBundle {
  const now = Date.now();
  return {
    workspace: {
      id: workspaceId,
      name: '',
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    },
    groups: [],
    tabs: [],
  };
}

export const workspaceBundleAtomFamily = atomFamily((workspaceId: string) =>
  atomWithStorage<WorkspaceBundle>(workspaceStorageKey(workspaceId), defaultBundle(workspaceId), undefined, {
    getOnInit: true,
  }),
);

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

export const activePaneAtom = atom<'primary' | 'side'>('primary');

// --------------------------------------------------------------------------
// Derived selectors (read-only)
// --------------------------------------------------------------------------

export const workspacesAtom = atom((get) => {
  const ids = get(workspaceIdsAtom);
  return ids.map((id, idx) => {
    const b = get(workspaceBundleAtomFamily(id));
    return { ...b.workspace, id, orderIndex: idx };
  });
});

export const tabGroupsAtom = atom((get) => {
  const ids = get(workspaceIdsAtom);
  const out: TabGroupRow[] = [];
  for (const id of ids) {
    out.push(...get(workspaceBundleAtomFamily(id)).groups);
  }
  return out;
});

export const tabsAtom = atom((get) => {
  const ids = get(workspaceIdsAtom);
  const out: TabRow[] = [];
  for (const id of ids) {
    out.push(...get(workspaceBundleAtomFamily(id)).tabs);
  }
  return out;
});

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
// Store helpers
// --------------------------------------------------------------------------

export function flattenTabsFromStore(store: JotaiStore): TabRow[] {
  const ids = store.get(workspaceIdsAtom);
  const out: TabRow[] = [];
  for (const wid of ids) {
    out.push(...store.get(workspaceBundleAtomFamily(wid)).tabs);
  }
  return out;
}

export function findWorkspaceIdForTab(store: JotaiStore, tabId: string): string | null {
  for (const wid of store.get(workspaceIdsAtom)) {
    const b = store.get(workspaceBundleAtomFamily(wid));
    if (b.tabs.some((t) => t.id === tabId)) return wid;
  }
  return null;
}

export function firstTabIdInWorkspace(store: JotaiStore, workspaceId: string): string | null {
  const b = store.get(workspaceBundleAtomFamily(workspaceId));
  const sorted = [...b.tabs].sort((a, c) => a.orderIndex - c.orderIndex);
  return sorted[0]?.id ?? null;
}

export function ensureDefaultGroupInStore(store: JotaiStore, workspaceId: string): TabGroupRow {
  const atom = workspaceBundleAtomFamily(workspaceId);
  const b = store.get(atom);
  const sorted = [...b.groups].sort((a, c) => a.orderIndex - c.orderIndex);
  if (sorted[0]) return sorted[0];
  const groupId = newId();
  const g: TabGroupRow = {
    id: groupId,
    workspaceId,
    name: 'Default',
    color: pickColor(0),
    collapsed: false,
    orderIndex: 0,
  };
  store.set(atom, {
    ...b,
    groups: [...b.groups, g],
    workspace: { ...b.workspace, updatedAt: Date.now() },
  });
  return g;
}

export function updateWorkspaceBundle(
  store: JotaiStore,
  workspaceId: string,
  fn: (b: WorkspaceBundle) => WorkspaceBundle,
): void {
  const atom = workspaceBundleAtomFamily(workspaceId);
  store.set(atom, fn(store.get(atom)));
}

export function patchTabRow(store: JotaiStore, tabId: string, patch: Partial<TabRow>): void {
  const wid = findWorkspaceIdForTab(store, tabId);
  if (!wid) return;
  updateWorkspaceBundle(store, wid, (b) => ({
    ...b,
    tabs: b.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
  }));
}

export function touchTabUpdatedAt(store: JotaiStore, tabId: string): void {
  patchTabRow(store, tabId, { updatedAt: Date.now() });
}

export function normalizeAllTabThemes(store: JotaiStore): void {
  for (const wid of store.get(workspaceIdsAtom)) {
    updateWorkspaceBundle(store, wid, (b) => {
      let changed = false;
      const tabs = b.tabs.map((t) => {
        const n = normalizePendingNodeTheme(t.pendingNodeTheme as unknown);
        if (t.pendingNodeTheme !== n) {
          changed = true;
          return { ...t, pendingNodeTheme: n };
        }
        return t;
      });
      return changed ? { ...b, tabs } : b;
    });
  }
}

export function removeGraphStorageForTab(_store: JotaiStore, tabId: string): void {
  graphDocAtomFamily.remove(tabId);
  try {
    localStorage.removeItem(graphStorageKey(tabId));
  } catch {
    /* ignore */
  }
}

export function pruneEmptyWorkspacesInStore(store: JotaiStore): void {
  const ids = [...store.get(workspaceIdsAtom)];
  if (ids.length <= 1) return;
  const next = ids.filter((wid) => {
    const b = store.get(workspaceBundleAtomFamily(wid));
    return b.groups.length > 0;
  });
  if (next.length === ids.length) return;
  for (const wid of ids) {
    if (next.includes(wid)) continue;
    const b = store.get(workspaceBundleAtomFamily(wid));
    for (const t of b.tabs) {
      removeGraphStorageForTab(store, t.id);
    }
    localStorage.removeItem(workspaceStorageKey(wid));
    workspaceBundleAtomFamily.remove(wid);
  }
  store.set(workspaceIdsAtom, next);
}

export function ensureDefaultWorkspaceInStore(store: JotaiStore): void {
  const ids = store.get(workspaceIdsAtom);
  if (ids.length > 0) {
    const wid = ids[0]!;
    const atom = workspaceBundleAtomFamily(wid);
    let b = store.get(atom);
    if (b.groups.length === 0) {
      const groupId = newId();
      const group: TabGroupRow = {
        id: groupId,
        workspaceId: wid,
        name: 'Default',
        color: pickColor(0),
        collapsed: false,
        orderIndex: 0,
      };
      b = {
        ...b,
        workspace: {
          ...b.workspace,
          name: b.workspace.name || 'Default',
          updatedAt: Date.now(),
        },
        groups: [group],
      };
      store.set(atom, b);
    }
    b = store.get(atom);
    const group = b.groups[0]!;
    if (b.tabs.length === 0) {
      const tabId = newId();
      const now = Date.now();
      const tab: TabRow = {
        id: tabId,
        tabGroupId: group.id,
        name: 'untitled',
        layout: 'elk',
        orderIndex: 0,
        updatedAt: now,
      };
      store.set(atom, { ...b, tabs: [tab] });
      store.set(graphDocAtomFamily(tabId), emptyGraphDoc());
    }
    return;
  }

  const now = Date.now();
  const workspaceId = newId();
  const tabGroupId = newId();
  const tabId = newId();
  const bundle: WorkspaceBundle = {
    workspace: {
      id: workspaceId,
      name: 'Default',
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    },
    groups: [
      {
        id: tabGroupId,
        workspaceId,
        name: 'Default',
        color: pickColor(0),
        collapsed: false,
        orderIndex: 0,
      },
    ],
    tabs: [
      {
        id: tabId,
        tabGroupId,
        name: 'untitled',
        layout: 'elk',
        orderIndex: 0,
        updatedAt: now,
      },
    ],
  };
  store.set(workspaceIdsAtom, [workspaceId]);
  store.set(workspaceBundleAtomFamily(workspaceId), bundle);
  store.set(graphDocAtomFamily(tabId), emptyGraphDoc());
}

export function reconcileNavigationPointers(store: JotaiStore): void {
  const ids = store.get(workspaceIdsAtom);
  const tabs = flattenTabsFromStore(store);
  let wid = store.get(currentWorkspaceIdAtom);
  if (!wid || !ids.includes(wid)) {
    wid = ids[0] ?? null;
    store.set(currentWorkspaceIdAtom, wid);
  }
  const tid = store.get(currentTabIdAtom);
  if (!tid || !tabs.some((t) => t.id === tid)) {
    store.set(currentTabIdAtom, wid ? firstTabIdInWorkspace(store, wid) : null);
  }
  const side = store.get(sidePaneTabIdAtom);
  if (side && !tabs.some((t) => t.id === side)) {
    store.set(sidePaneTabIdAtom, null);
  }
}
