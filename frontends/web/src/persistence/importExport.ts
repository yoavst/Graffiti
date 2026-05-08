// Import / export: legacy per-graph JSON `[idCounter, nodes, edges, config?]`, TAR bundles,
// and `graffiti-v2` TAR with manifest (workspaces, graph metadata, notes) + `graphs/<graphId>.json`.

import { newId } from '@/util/ids';
import { normalizePendingNodeTheme, type GraphDoc } from '@/graph/model';
import type { JotaiStore } from '@/state/store';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import {
  updateWorkspaceBundle,
  workspaceBundleAtomFamily,
  workspaceIdsAtom,
} from '@/state/workspaces';
import { emptyGraphDoc, type GraphRow, type WorkspaceBundle, type WorkspaceRow } from '@/state/workspaceTypes';
import { isTarBuffer, packTar, unpackTar } from './tar';

export const TAR_MANIFEST_NAME = 'manifest.json';

export interface GraffitiTarManifestV2 {
  format: 'graffiti-v2';
  workspaceIds: string[];
  bundles: Record<string, WorkspaceBundle>;
}

// --- JSON encode/decode -------------------------------------------------

export function encodeGraphJson(name: string, doc: GraphDoc, graph: GraphRow): string {
  const config = {
    elkRenderer: graph.layout === 'elk',
    notes: graph.notes,
    pendingNodeTheme: normalizePendingNodeTheme(graph.pendingNodeTheme as unknown),
    ...(doc.config?.colorLegend && Object.keys(doc.config.colorLegend).length > 0
      ? { colorLegend: doc.config.colorLegend }
      : {}),
  };
  return JSON.stringify([doc.idCounter, doc.nodes, doc.edges, config], null, 4);
  void name;
}

export function decodeGraphJson(s: string): GraphDoc {
  const arr = JSON.parse(s);
  if (!Array.isArray(arr) || arr.length < 3) throw new Error('invalid graph JSON');
  const [idCounter, nodes, edges, config] = arr as [
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
}

// --- File downloads -----------------------------------------------------

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportGraphToFile(store: JotaiStore, graphId: string): void {
  let row: GraphRow | undefined;
  for (const wid of store.get(workspaceIdsAtom)) {
    row = store.get(workspaceBundleAtomFamily(wid)).graphs.find((x) => x.id === graphId);
    if (row) break;
  }
  if (!row) return;
  const doc = store.get(graphDocAtomFamily(graphId));
  const json = encodeGraphJson(row.name, doc, row);
  download(`${row.name}.json`, new Blob([json], { type: 'application/json' }));
}

export function exportAllWorkspacesToTar(store: JotaiStore): void {
  const ids = store.get(workspaceIdsAtom);
  const bundles: Record<string, WorkspaceBundle> = {};
  for (const id of ids) {
    bundles[id] = store.get(workspaceBundleAtomFamily(id));
  }
  const manifest: GraffitiTarManifestV2 = {
    format: 'graffiti-v2',
    workspaceIds: [...ids],
    bundles,
  };
  const files: Array<{ name: string; content: string }> = [
    { name: TAR_MANIFEST_NAME, content: JSON.stringify(manifest, null, 2) },
  ];
  for (const wid of ids) {
    const b = bundles[wid]!;
    for (const g of b.graphs) {
      const doc = store.get(graphDocAtomFamily(g.id));
      files.push({ name: `graphs/${g.id}.json`, content: encodeGraphJson(g.name, doc, g) });
    }
  }
  const bytes = packTar(files);
  download('graffiti_export.tar', new Blob([bytes as BlobPart], { type: 'application/x-tar' }));
}

export function exportAllGraphsToTar(store: JotaiStore): void {
  exportAllWorkspacesToTar(store);
}

function importV2Tar(store: JotaiStore, entries: Array<{ name: string; content: string }>): string[] {
  const m = entries.find((e) => e.name === TAR_MANIFEST_NAME || e.name.endsWith(`/${TAR_MANIFEST_NAME}`));
  if (!m) return [];
  let manifest: GraffitiTarManifestV2;
  try {
    const p = JSON.parse(m.content) as GraffitiTarManifestV2;
    if (p.format !== 'graffiti-v2' || !Array.isArray(p.workspaceIds) || typeof p.bundles !== 'object') return [];
    manifest = p;
  } catch {
    return [];
  }

  const graphFiles = new Map<string, string>();
  for (const e of entries) {
    const norm = e.name.replace(/^\.\//, '');
    const match = /^graphs\/([^/]+)\.json$/.exec(norm);
    if (match) graphFiles.set(match[1]!, e.content);
  }

  const wsIdMap = new Map<string, string>();
  const groupIdMap = new Map<string, string>();
  const graphIdMap = new Map<string, string>();

  for (const oldW of manifest.workspaceIds) {
    wsIdMap.set(oldW, newId());
  }
  for (const oldW of manifest.workspaceIds) {
    const b = manifest.bundles[oldW];
    if (!b) continue;
    for (const g of b.groups) {
      groupIdMap.set(g.id, newId());
    }
    for (const t of b.graphs) {
      graphIdMap.set(t.id, newId());
    }
  }

  const newGraphIds: string[] = [];
  const nextWorkspaceList = [...store.get(workspaceIdsAtom)];

  for (const oldW of manifest.workspaceIds) {
    const b = manifest.bundles[oldW];
    if (!b) continue;
    const newW = wsIdMap.get(oldW)!;
    const now = Date.now();
    const workspace: WorkspaceRow = {
      ...b.workspace,
      id: newW,
      orderIndex: nextWorkspaceList.length,
      updatedAt: now,
    };
    const groups = b.groups.map((g) => ({
      ...g,
      id: groupIdMap.get(g.id)!,
      workspaceId: newW,
    }));
    const graphs = b.graphs.map((t) => {
      const nid = graphIdMap.get(t.id)!;
      newGraphIds.push(nid);
      return {
        ...t,
        id: nid,
        graphGroupId: groupIdMap.get(t.graphGroupId)!,
        updatedAt: now,
      };
    });
    store.set(workspaceBundleAtomFamily(newW), { workspace, groups, graphs });
    nextWorkspaceList.push(newW);

    for (const t of b.graphs) {
      const newGid = graphIdMap.get(t.id)!;
      const raw = graphFiles.get(t.id);
      const doc = raw ? decodeGraphJson(raw) : emptyGraphDoc();
      store.set(graphDocAtomFamily(newGid), doc);
    }
  }

  store.set(workspaceIdsAtom, nextWorkspaceList);
  return newGraphIds;
}

function persistImportedGraph(store: JotaiStore, name: string, doc: GraphDoc, targetGroupId: string): string {
  let targetWid: string | null = null;
  for (const wid of store.get(workspaceIdsAtom)) {
    const b = store.get(workspaceBundleAtomFamily(wid));
    if (b.groups.some((g) => g.id === targetGroupId)) {
      targetWid = wid;
      break;
    }
  }
  if (!targetWid) {
    throw new Error('import: target group not found');
  }
  const bundle = store.get(workspaceBundleAtomFamily(targetWid));
  const existing = bundle.graphs.filter((g) => g.graphGroupId === targetGroupId);
  const id = newId();
  const graph: GraphRow = {
    id,
    graphGroupId: targetGroupId,
    name,
    layout: doc.config?.elkRenderer === false ? 'dagre' : 'elk',
    notes: doc.config?.notes,
    pendingNodeTheme: normalizePendingNodeTheme(doc.config?.pendingNodeTheme as unknown),
    orderIndex: existing.length,
    updatedAt: Date.now(),
  };
  updateWorkspaceBundle(store, targetWid, (b) => ({
    ...b,
    graphs: [...b.graphs, graph],
  }));
  store.set(graphDocAtomFamily(id), doc);
  return id;
}

// --- File-based import --------------------------------------------------

export function importFile(store: JotaiStore, file: File, targetGroupId: string): Promise<string[]> {
  return file.arrayBuffer().then((buf) => {
    if (isTarBuffer(buf)) {
      const entries = unpackTar(buf);
      const v2Ids = importV2Tar(store, entries);
      if (v2Ids.length > 0) return v2Ids;

      const ids: string[] = [];
      for (const entry of entries) {
        const norm = entry.name.replace(/^\.\//, '');
        if (norm === TAR_MANIFEST_NAME || norm.endsWith(`/${TAR_MANIFEST_NAME}`)) continue;
        if (norm.startsWith('graphs/')) continue;
        try {
          const doc = decodeGraphJson(entry.content);
          ids.push(persistImportedGraph(store, stripJson(entry.name), doc, targetGroupId));
        } catch (e) {
          console.warn('skipped tar entry', entry.name, e);
        }
      }
      return ids;
    }
    const text = new TextDecoder().decode(buf);
    const doc = decodeGraphJson(text);
    return [persistImportedGraph(store, stripJson(file.name), doc, targetGroupId)];
  });
}

function stripJson(s: string): string {
  return s.endsWith('.json') ? s.slice(0, -5) : s;
}
