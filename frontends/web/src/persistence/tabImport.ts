import { getStore, type JotaiStore } from '@/state/store';
import { getActiveTabFromStore } from '@/state/registry';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  currentWorkspaceGroupsAtom,
  tabsAtom,
} from '@/state/workspaces';
import { importFile } from '@/persistence/importExport';

export function resolveImportTargetGroupId(store: JotaiStore): string | null {
  const cur = getActiveTabFromStore(store);
  if (cur) {
    const tab = store.get(tabsAtom).find((t) => t.id === cur.tabId);
    if (tab) return tab.tabGroupId;
  }
  const tabIdFromAtom = store.get(currentTabIdAtom);
  if (tabIdFromAtom) {
    const tab = store.get(tabsAtom).find((t) => t.id === tabIdFromAtom);
    if (tab) return tab.tabGroupId;
  }
  const wid = store.get(currentWorkspaceIdAtom);
  if (wid) {
    const groups = store.get(currentWorkspaceGroupsAtom);
    return groups[0]?.id ?? null;
  }
  return null;
}

export async function importUserPickedFiles(
  files: readonly File[],
): Promise<{ firstTabId: string | null; targetMissing: boolean }> {
  const store = getStore();
  const targetGroupId = resolveImportTargetGroupId(store);
  if (!targetGroupId) {
    return { firstTabId: null, targetMissing: true };
  }
  let firstImportedTabId: string | null = null;
  for (const f of files) {
    try {
      const importedIds = await importFile(store, f, targetGroupId);
      if (!firstImportedTabId && importedIds[0]) firstImportedTabId = importedIds[0];
    } catch (err) {
      console.error('import failed for', f.name, err);
    }
  }
  return { firstTabId: firstImportedTabId, targetMissing: false };
}
