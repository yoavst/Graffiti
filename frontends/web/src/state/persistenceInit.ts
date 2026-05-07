import { readUrlState } from '@/routing/url';
import type { JotaiStore } from '@/state/store';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultWorkspaceInStore,
  firstTabIdInWorkspace,
  flattenTabsFromStore,
  normalizeAllTabThemes,
  pruneEmptyWorkspacesInStore,
  reconcileNavigationPointers,
  sidePaneTabIdAtom,
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
  normalizeAllTabThemes(store);

  const ids = store.get(workspaceIdsAtom);
  const tabs = flattenTabsFromStore(store);

  let wid = store.get(currentWorkspaceIdAtom);
  if (!wid || !ids.includes(wid)) {
    wid = ids[0] ?? null;
    store.set(currentWorkspaceIdAtom, wid);
  }

  const tid = store.get(currentTabIdAtom);
  if (!tid || !tabs.some((t) => t.id === tid)) {
    const fallback = wid ? firstTabIdInWorkspace(store, wid) : null;
    store.set(currentTabIdAtom, fallback);
  }

  const url = readUrlState();
  if (url.workspace && ids.includes(url.workspace)) {
    store.set(currentWorkspaceIdAtom, url.workspace);
  }
  if (url.tab && tabs.some((t) => t.id === url.tab)) {
    store.set(currentTabIdAtom, url.tab);
  }
  if (url.pane2 && tabs.some((t) => t.id === url.pane2)) {
    store.set(sidePaneTabIdAtom, url.pane2);
  }

  reconcileNavigationPointers(store);
}
