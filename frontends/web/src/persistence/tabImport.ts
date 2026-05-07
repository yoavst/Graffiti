import { getStore } from '@/state/store';
import { getActiveTabFromStore } from '@/state/registry';
import { currentTabIdAtom, currentWorkspaceIdAtom } from '@/state/workspaces';
import { db } from '@/persistence/db';
import { importFile } from '@/persistence/importExport';

export async function resolveImportTargetGroupId(): Promise<string | null> {
  let targetGroupId: string | null = null;
  const cur = getActiveTabFromStore(getStore());
  if (cur) {
    const tab = await db.tabs.get(cur.tabId);
    if (tab) targetGroupId = tab.tabGroupId;
  }
  if (!targetGroupId) {
    const tabIdFromAtom = getStore().get(currentTabIdAtom);
    if (tabIdFromAtom) {
      const tab = await db.tabs.get(tabIdFromAtom);
      if (tab) targetGroupId = tab.tabGroupId;
    }
  }
  if (!targetGroupId) {
    const wid = getStore().get(currentWorkspaceIdAtom);
    if (wid) {
      const g = await db.tabGroups.where('workspaceId').equals(wid).first();
      if (g) targetGroupId = g.id;
    }
  }
  return targetGroupId;
}

export async function importUserPickedFiles(
  files: readonly File[],
): Promise<{ firstTabId: string | null; targetMissing: boolean }> {
  const targetGroupId = await resolveImportTargetGroupId();
  if (!targetGroupId) {
    return { firstTabId: null, targetMissing: true };
  }
  let firstImportedTabId: string | null = null;
  for (const f of files) {
    try {
      const importedIds = await importFile(f, targetGroupId);
      if (!firstImportedTabId && importedIds[0]) firstImportedTabId = importedIds[0];
    } catch (err) {
      console.error('import failed for', f.name, err);
    }
  }
  return { firstTabId: firstImportedTabId, targetMissing: false };
}
