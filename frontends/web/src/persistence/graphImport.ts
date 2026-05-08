import { getStore, type JotaiStore } from '@/state/store';
import { getActiveGraphFromStore } from '@/state/registry';
import {
  currentGraphIdAtom,
  currentWorkspaceIdAtom,
  currentWorkspaceGroupsAtom,
  graphsAtom,
} from '@/state/workspaces';
import { importFile } from '@/persistence/importExport';

export function resolveImportTargetGroupId(store: JotaiStore): string | null {
  const cur = getActiveGraphFromStore(store);
  if (cur) {
    const graph = store.get(graphsAtom).find((g) => g.id === cur.graphId);
    if (graph) return graph.graphGroupId;
  }
  const graphIdFromAtom = store.get(currentGraphIdAtom);
  if (graphIdFromAtom) {
    const graph = store.get(graphsAtom).find((g) => g.id === graphIdFromAtom);
    if (graph) return graph.graphGroupId;
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
): Promise<{ firstGraphId: string | null; targetMissing: boolean }> {
  const store = getStore();
  const targetGroupId = resolveImportTargetGroupId(store);
  if (!targetGroupId) {
    return { firstGraphId: null, targetMissing: true };
  }
  let firstImportedGraphId: string | null = null;
  for (const f of files) {
    try {
      const importedIds = await importFile(store, f, targetGroupId);
      if (!firstImportedGraphId && importedIds[0]) firstImportedGraphId = importedIds[0];
    } catch (err) {
      console.error('import failed for', f.name, err);
    }
  }
  return { firstGraphId: firstImportedGraphId, targetMissing: false };
}

