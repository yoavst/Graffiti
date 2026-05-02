import type { JotaiStore } from '@/state/store';
import type { TabRow } from '@/persistence/db';
import type { NodeSearchScope } from '@/state/quickOpenPalettes';
import {
  activeTabIdAtom,
  currentWorkspaceGroupsAtom,
  currentWorkspaceIdAtom,
  tabsAtom,
  tabsByGroupAtom,
} from '@/state/workspaces';
import { getTab } from '@/state/registry';
import { db } from '@/persistence/db';
import type { GNode } from '@/graph/model';

export function orderedWorkspaceTabs(store: JotaiStore): TabRow[] {
  const wid = store.get(currentWorkspaceIdAtom);
  if (!wid) return [];
  const groups = store.get(currentWorkspaceGroupsAtom);
  const byGroup = store.get(tabsByGroupAtom);
  const out: TabRow[] = [];
  for (const g of groups) {
    out.push(...(byGroup.get(g.id) ?? []));
  }
  return out;
}

export type NavNodeHit = {
  tabId: string;
  tabName: string;
  nodeId: number;
  searchValue: string;
  displayLabel: string;
  theme?: number;
  flavor: 'code' | 'markdown' | 'comment';
};

async function nodesForTab(tabId: string, tabName: string): Promise<NavNodeHit[]> {
  const reg = getTab(tabId);
  const nodes: GNode[] = reg ? reg.rt.doc.nodes : ((await db.graphs.get(tabId))?.doc.nodes ?? []);
  return nodes.map((n) => {
    const displayLabel = (n.overrideLabel ?? n.label).trim() || `#${n.id}`;
    return {
      tabId,
      tabName,
      nodeId: n.id,
      searchValue: `${tabName} ${displayLabel} ${n.extra.project ?? ''} ${n.extra.address ?? ''}`.replace(/\s+/g, ' ').trim(),
      displayLabel,
      theme: n.theme,
      flavor:
        n.extra.isComment ? 'comment'
        : n.extra.isMarkdown ? 'markdown'
        : 'code',
    };
  });
}

/** `currentTab` = focused pane’s graph (`activeTabIdAtom`). `allTabs` = every tab in the workspace. */
export async function loadNavNodeHits(store: JotaiStore, scope: NodeSearchScope): Promise<NavNodeHit[]> {
  if (scope === 'currentTab') {
    const tabId = store.get(activeTabIdAtom);
    if (!tabId) return [];
    const tab = store.get(tabsAtom).find((t) => t.id === tabId);
    return nodesForTab(tabId, tab?.name ?? 'Graph');
  }
  const ordered = orderedWorkspaceTabs(store);
  const batches = await Promise.all(ordered.map((t) => nodesForTab(t.id, t.name)));
  return batches.flat();
}
