import type { JotaiStore } from '@/state/store';
import type { TabRow } from '@/state/workspaceTypes';
import type { NodeSearchScope } from '@/state/quickOpenPalettes';
import {
  activeTabIdAtom,
  currentWorkspaceGroupsAtom,
  currentWorkspaceIdAtom,
  tabsAtom,
  tabsByGroupAtom,
} from '@/state/workspaces';
import { getTab } from '@/state/registry';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
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

function nodesForTab(store: JotaiStore, tabId: string, tabName: string): NavNodeHit[] {
  const reg = getTab(tabId);
  const nodes: GNode[] = reg ? reg.rt.doc.nodes : store.get(graphDocAtomFamily(tabId)).nodes;
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
export function loadNavNodeHits(store: JotaiStore, scope: NodeSearchScope): NavNodeHit[] {
  if (scope === 'currentTab') {
    const tabId = store.get(activeTabIdAtom);
    if (!tabId) return [];
    const tab = store.get(tabsAtom).find((t) => t.id === tabId);
    return nodesForTab(store, tabId, tab?.name ?? 'Graph');
  }
  const ordered = orderedWorkspaceTabs(store);
  return ordered.flatMap((t) => nodesForTab(store, t.id, t.name));
}
