import type { JotaiStore } from '@/state/store';
import type { GraphRow } from '@/state/workspaceTypes';
import type { NodeSearchScope } from '@/state/quickOpenPalettes';
import {
  activeGraphIdAtom,
  currentWorkspaceGroupsAtom,
  currentWorkspaceIdAtom,
  graphsAtom,
  graphsByGroupAtom,
} from '@/state/workspaces';
import { getGraph } from '@/state/registry';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import type { GNode } from '@/graph/model';

export function orderedWorkspaceGraphs(store: JotaiStore): GraphRow[] {
  const wid = store.get(currentWorkspaceIdAtom);
  if (!wid) return [];
  const groups = store.get(currentWorkspaceGroupsAtom);
  const byGroup = store.get(graphsByGroupAtom);
  const out: GraphRow[] = [];
  for (const g of groups) {
    out.push(...(byGroup.get(g.id) ?? []));
  }
  return out;
}

export type NavNodeHit = {
  graphId: string;
  graphName: string;
  nodeId: number;
  searchValue: string;
  displayLabel: string;
  theme?: number;
  flavor: 'code' | 'markdown' | 'comment';
};

function nodesForGraph(store: JotaiStore, graphId: string, graphName: string): NavNodeHit[] {
  const reg = getGraph(graphId);
  const nodes: GNode[] = reg ? reg.rt.doc.nodes : store.get(graphDocAtomFamily(graphId)).nodes;
  return nodes.map((n) => {
    const displayLabel = (n.overrideLabel ?? n.label).trim() || `#${n.id}`;
    return {
      graphId,
      graphName,
      nodeId: n.id,
      searchValue: `${graphName} ${displayLabel} ${n.extra.project ?? ''} ${n.extra.address ?? ''}`.replace(/\s+/g, ' ').trim(),
      displayLabel,
      theme: n.theme,
      flavor:
        n.extra.isComment ? 'comment'
        : n.extra.isMarkdown ? 'markdown'
        : 'code',
    };
  });
}

/** `currentTab` = focused pane’s graph (`activeGraphIdAtom`). `allTabs` = every graph in the workspace. */
export function loadNavNodeHits(store: JotaiStore, scope: NodeSearchScope): NavNodeHit[] {
  if (scope === 'currentTab') {
    const graphId = store.get(activeGraphIdAtom);
    if (!graphId) return [];
    const graph = store.get(graphsAtom).find((g) => g.id === graphId);
    return nodesForGraph(store, graphId, graph?.name ?? 'Graph');
  }
  const ordered = orderedWorkspaceGraphs(store);
  return ordered.flatMap((g) => nodesForGraph(store, g.id, g.name));
}
