import { readUrlState } from '@/routing/url';
import type { JotaiStore } from '@/state/store';
import {
  currentGraphIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultWorkspaceInStore,
  firstGraphIdInWorkspace,
  flattenGraphsFromStore,
  normalizeAllGraphThemes,
  pruneEmptyWorkspacesInStore,
  reconcileNavigationPointers,
  sidePaneGraphIdAtom,
  workspaceIdsAtom,
} from '@/state/workspaces';
import { migrateLegacyIfNeeded } from '@/persistence/migrations';

let initialized = false;

/** Run once before first paint: legacy migration, prune, default workspace, URL reconciliation. */
export function initPersistence(store: JotaiStore): void {
  if (initialized) return;
  initialized = true;
  migrateLegacyIfNeeded(store);
  pruneEmptyWorkspacesInStore(store);
  ensureDefaultWorkspaceInStore(store);
  normalizeAllGraphThemes(store);

  const ids = store.get(workspaceIdsAtom);
  const graphs = flattenGraphsFromStore(store);

  let wid = store.get(currentWorkspaceIdAtom);
  if (!wid || !ids.includes(wid)) {
    wid = ids[0] ?? null;
    store.set(currentWorkspaceIdAtom, wid);
  }

  const gid = store.get(currentGraphIdAtom);
  if (!gid || !graphs.some((g) => g.id === gid)) {
    const fallback = wid ? firstGraphIdInWorkspace(store, wid) : null;
    store.set(currentGraphIdAtom, fallback);
  }

  const url = readUrlState();
  if (url.workspace && ids.includes(url.workspace)) {
    store.set(currentWorkspaceIdAtom, url.workspace);
  }
  if (url.graph && graphs.some((g) => g.id === url.graph)) {
    store.set(currentGraphIdAtom, url.graph);
  }
  if (url.pane2 && graphs.some((g) => g.id === url.pane2)) {
    store.set(sidePaneGraphIdAtom, url.pane2);
  }

  reconcileNavigationPointers(store);
}
