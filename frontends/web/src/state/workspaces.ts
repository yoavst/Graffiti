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
  type GraphGroupRow,
  type GraphRow,
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
    graphs: [],
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
export const currentGraphIdAtom = atomWithStorage<string | null>('currentGraphId', null, undefined, {
  getOnInit: true,
});
export const sidePaneGraphIdAtom = atomWithStorage<string | null>('sidePaneGraphId', null, undefined, {
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

export const graphGroupsAtom = atom((get) => {
  const ids = get(workspaceIdsAtom);
  const out: GraphGroupRow[] = [];
  for (const id of ids) {
    out.push(...get(workspaceBundleAtomFamily(id)).groups);
  }
  return out;
});

export const graphsAtom = atom((get) => {
  const ids = get(workspaceIdsAtom);
  const out: GraphRow[] = [];
  for (const id of ids) {
    out.push(...get(workspaceBundleAtomFamily(id)).graphs);
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
  return get(graphGroupsAtom)
    .filter((g) => g.workspaceId === wid)
    .sort((a, b) => a.orderIndex - b.orderIndex);
});

export const graphsByGroupAtom = atom((get) => {
  const graphs = get(graphsAtom);
  const out = new Map<string, GraphRow[]>();
  for (const g of graphs) {
    const arr = out.get(g.graphGroupId) ?? [];
    arr.push(g);
    out.set(g.graphGroupId, arr);
  }
  for (const arr of out.values()) arr.sort((a, b) => a.orderIndex - b.orderIndex);
  return out;
});

export const currentGraphAtom = atom((get) => {
  const id = get(currentGraphIdAtom);
  return get(graphsAtom).find((g) => g.id === id) ?? null;
});

export const activeGraphIdAtom = atom((get) => {
  const which = get(activePaneAtom);
  if (which === 'side') {
    const id = get(sidePaneGraphIdAtom);
    if (id && get(graphsAtom).find((g) => g.id === id)) return id;
  }
  return get(currentGraphIdAtom);
});

export const activeGraphAtom = atom((get) => {
  const id = get(activeGraphIdAtom);
  return get(graphsAtom).find((g) => g.id === id) ?? null;
});

// --------------------------------------------------------------------------
// Store helpers
// --------------------------------------------------------------------------

export function flattenGraphsFromStore(store: JotaiStore): GraphRow[] {
  const ids = store.get(workspaceIdsAtom);
  const out: GraphRow[] = [];
  for (const wid of ids) {
    out.push(...store.get(workspaceBundleAtomFamily(wid)).graphs);
  }
  return out;
}

export function findWorkspaceIdForGraph(store: JotaiStore, graphId: string): string | null {
  for (const wid of store.get(workspaceIdsAtom)) {
    const b = store.get(workspaceBundleAtomFamily(wid));
    if (b.graphs.some((g) => g.id === graphId)) return wid;
  }
  return null;
}

export function firstGraphIdInWorkspace(store: JotaiStore, workspaceId: string): string | null {
  const b = store.get(workspaceBundleAtomFamily(workspaceId));
  const sorted = [...b.graphs].sort((a, c) => a.orderIndex - c.orderIndex);
  return sorted[0]?.id ?? null;
}

export function ensureDefaultGroupInStore(store: JotaiStore, workspaceId: string): GraphGroupRow {
  const atom = workspaceBundleAtomFamily(workspaceId);
  const b = store.get(atom);
  const sorted = [...b.groups].sort((a, c) => a.orderIndex - c.orderIndex);
  if (sorted[0]) return sorted[0];
  const groupId = newId();
  const g: GraphGroupRow = {
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

export function patchGraphRow(store: JotaiStore, graphId: string, patch: Partial<GraphRow>): void {
  const wid = findWorkspaceIdForGraph(store, graphId);
  if (!wid) return;
  updateWorkspaceBundle(store, wid, (b) => ({
    ...b,
    graphs: b.graphs.map((g) => (g.id === graphId ? { ...g, ...patch } : g)),
  }));
}

export function touchGraphUpdatedAt(store: JotaiStore, graphId: string): void {
  patchGraphRow(store, graphId, { updatedAt: Date.now() });
}

export function normalizeAllGraphThemes(store: JotaiStore): void {
  for (const wid of store.get(workspaceIdsAtom)) {
    updateWorkspaceBundle(store, wid, (b) => {
      let changed = false;
      const graphs = b.graphs.map((g) => {
        const n = normalizePendingNodeTheme(g.pendingNodeTheme as unknown);
        if (g.pendingNodeTheme !== n) {
          changed = true;
          return { ...g, pendingNodeTheme: n };
        }
        return g;
      });
      return changed ? { ...b, graphs } : b;
    });
  }
}

export function removeGraphStorageForGraph(_store: JotaiStore, graphId: string): void {
  graphDocAtomFamily.remove(graphId);
  try {
    localStorage.removeItem(graphStorageKey(graphId));
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
    for (const g of b.graphs) {
      removeGraphStorageForGraph(store, g.id);
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
      const group: GraphGroupRow = {
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
    if (b.graphs.length === 0) {
      const graphId = newId();
      const now = Date.now();
      const graph: GraphRow = {
        id: graphId,
        graphGroupId: group.id,
        name: 'untitled',
        layout: 'elk',
        orderIndex: 0,
        updatedAt: now,
      };
      store.set(atom, { ...b, graphs: [graph] });
      store.set(graphDocAtomFamily(graphId), emptyGraphDoc());
    }
    return;
  }

  const now = Date.now();
  const workspaceId = newId();
  const graphGroupId = newId();
  const graphId = newId();
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
        id: graphGroupId,
        workspaceId,
        name: 'Default',
        color: pickColor(0),
        collapsed: false,
        orderIndex: 0,
      },
    ],
    graphs: [
      {
        id: graphId,
        graphGroupId,
        name: 'untitled',
        layout: 'elk',
        orderIndex: 0,
        updatedAt: now,
      },
    ],
  };
  store.set(workspaceIdsAtom, [workspaceId]);
  store.set(workspaceBundleAtomFamily(workspaceId), bundle);
  store.set(graphDocAtomFamily(graphId), emptyGraphDoc());
}

export function reconcileNavigationPointers(store: JotaiStore): void {
  const ids = store.get(workspaceIdsAtom);
  const graphs = flattenGraphsFromStore(store);
  let wid = store.get(currentWorkspaceIdAtom);
  if (!wid || !ids.includes(wid)) {
    wid = ids[0] ?? null;
    store.set(currentWorkspaceIdAtom, wid);
  }
  const gid = store.get(currentGraphIdAtom);
  if (!gid || !graphs.some((g) => g.id === gid)) {
    store.set(currentGraphIdAtom, wid ? firstGraphIdInWorkspace(store, wid) : null);
  }
  const side = store.get(sidePaneGraphIdAtom);
  if (side && !graphs.some((g) => g.id === side)) {
    store.set(sidePaneGraphIdAtom, null);
  }
}
