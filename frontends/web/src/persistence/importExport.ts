// Import / export of tabs as legacy-compatible JSON and TAR bundles.
//
// JSON format (per tab):  [idCounter, nodes, edges, config?]
// TAR bundle: one entry per tab, named "<tabName>.json".

import { db } from './db';
import { newId } from '@/util/ids';
import type { GraphDoc } from '@/graph/model';
import type { TabRow } from './db';
import { isTarBuffer, packTar, unpackTar } from './tar';

// --- JSON encode/decode -------------------------------------------------

export function encodeTabJson(name: string, doc: GraphDoc, tab: TabRow): string {
  const config = {
    elkRenderer: tab.layout === 'elk',
    notes: tab.notes,
    pendingNodeTheme: tab.pendingNodeTheme,
  };
  return JSON.stringify([doc.idCounter, doc.nodes, doc.edges, config], null, 4);
  void name;
}

export function decodeTabJson(s: string): GraphDoc {
  const arr = JSON.parse(s);
  if (!Array.isArray(arr) || arr.length < 3) throw new Error('invalid tab JSON');
  const [idCounter, nodes, edges, config] = arr as [number, GraphDoc['nodes'], GraphDoc['edges'], GraphDoc['config']?];
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

export async function exportTabToFile(tabId: string) {
  const tab = await db.tabs.get(tabId);
  const graph = await db.graphs.get(tabId);
  if (!tab || !graph) return;
  const json = encodeTabJson(tab.name, graph.doc, tab);
  download(`${tab.name}.json`, new Blob([json], { type: 'application/json' }));
}

export async function exportAllTabsToTar() {
  const tabs = await db.tabs.toArray();
  const graphs = await db.graphs.toArray();
  const graphsById = new Map(graphs.map((g) => [g.tabId, g.doc]));
  const used = new Set<string>();
  const files: Array<{ name: string; content: string }> = [];

  for (const tab of tabs) {
    const doc = graphsById.get(tab.id);
    if (!doc) continue;
    let name = tab.name;
    let suffix = 1;
    while (used.has(name)) {
      name = `${tab.name}_${suffix++}`;
    }
    used.add(name);
    files.push({ name: `${name}.json`, content: encodeTabJson(name, doc, tab) });
  }

  const bytes = packTar(files);
  download('graffiti_export.tar', new Blob([bytes as BlobPart], { type: 'application/x-tar' }));
}

// --- File-based import --------------------------------------------------

export async function importFile(file: File, targetGroupId: string): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const ids: string[] = [];
  if (isTarBuffer(buf)) {
    const entries = unpackTar(buf);
    for (const entry of entries) {
      try {
        const doc = decodeTabJson(entry.content);
        const id = await persistImportedTab(stripJson(entry.name), doc, targetGroupId);
        ids.push(id);
      } catch (e) {
        console.warn('skipped tar entry', entry.name, e);
      }
    }
  } else {
    const text = new TextDecoder().decode(buf);
    const doc = decodeTabJson(text);
    const id = await persistImportedTab(stripJson(file.name), doc, targetGroupId);
    ids.push(id);
  }
  return ids;
}

function stripJson(s: string): string {
  return s.endsWith('.json') ? s.slice(0, -5) : s;
}

async function persistImportedTab(
  name: string,
  doc: GraphDoc,
  targetGroupId: string,
): Promise<string> {
  const existing = await db.tabs.where('tabGroupId').equals(targetGroupId).toArray();
  const id = newId();
  await db.tabs.put({
    id,
    tabGroupId: targetGroupId,
    name,
    layout: doc.config?.elkRenderer === false ? 'dagre' : 'elk',
    notes: doc.config?.notes,
    pendingNodeTheme: doc.config?.pendingNodeTheme,
    orderIndex: existing.length,
    updatedAt: Date.now(),
  });
  await db.graphs.put({ tabId: id, doc });
  return id;
}
