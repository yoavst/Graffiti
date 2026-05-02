import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  loadAll,
  sidePaneTabIdAtom,
  tabGroupsAtom,
  tabsAtom,
  workspacesAtom,
} from '@/state/workspaces';
import { db, pickColor, type TabRow, type TabGroupRow } from '@/persistence/db';
import { newId } from '@/util/ids';
import { sidebarVisibleAtom } from '@/state/settings';
import { ContextMenu, type ContextMenuItem } from '@/ui/ContextMenu';
import { dialogs } from '@/ui/dialogs/Dialogs';

// Tab groups are no longer surfaced in the UI: every workspace is treated as
// having a single implicit "default" group. The DB still has a tabGroupId
// column on tabs (legacy schema), so we resolve a workspace's home group
// lazily and create one on demand if missing.
async function ensureDefaultGroup(workspaceId: string): Promise<TabGroupRow> {
  const existing = await db.tabGroups.where('workspaceId').equals(workspaceId).toArray();
  existing.sort((a, b) => a.orderIndex - b.orderIndex);
  if (existing[0]) return existing[0];
  const g: TabGroupRow = {
    id: newId(),
    workspaceId,
    name: 'Default',
    color: pickColor(0),
    collapsed: false,
    orderIndex: 0,
  };
  await db.tabGroups.put(g);
  return g;
}

export function Sidebar() {
  const visible = useAtomValue(sidebarVisibleAtom);
  const setVisible = useSetAtom(sidebarVisibleAtom);
  const workspaces = useAtomValue(workspacesAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const tabs = useAtomValue(tabsAtom);
  const [currentWsId, setCurrentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentTabId, setCurrentTabId] = useAtom(currentTabIdAtom);
  const sidePaneTabId = useAtomValue(sidePaneTabIdAtom);
  const setWorkspaces = useSetAtom(workspacesAtom);
  const setGroups = useSetAtom(tabGroupsAtom);
  const setTabs = useSetAtom(tabsAtom);

  // Per-workspace expanded state. Defaults to "expanded" the first time we
  // see a workspace, and the current workspace is always expanded.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({}));
  const [search, setSearch] = useState('');

  // Group workspaceId → tabs sorted by orderIndex.
  const tabsByWorkspace = useMemo(() => {
    const groupToWs = new Map<string, string>();
    for (const g of groups) groupToWs.set(g.id, g.workspaceId);
    const out = new Map<string, TabRow[]>();
    for (const t of tabs) {
      const wsId = groupToWs.get(t.tabGroupId);
      if (!wsId) continue;
      const arr = out.get(wsId) ?? [];
      arr.push(t);
      out.set(wsId, arr);
    }
    for (const arr of out.values()) arr.sort((a, b) => a.orderIndex - b.orderIndex);
    return out;
  }, [tabs, groups]);

  // Auto-switch the current workspace whenever the current tab moves to a
  // different workspace (e.g., via "Move to" in the context menu).
  useEffect(() => {
    if (!currentTabId) return;
    const t = tabs.find((x) => x.id === currentTabId);
    if (!t) return;
    const g = groups.find((x) => x.id === t.tabGroupId);
    if (!g) return;
    if (g.workspaceId !== currentWsId) setCurrentWsId(g.workspaceId);
  }, [currentTabId, tabs, groups, currentWsId, setCurrentWsId]);

  const query = search.trim().toLowerCase();

  // While a search is active, persist auto-expansion: any workspace that is
  // currently collapsed but has matching tabs becomes uncollapsed in the
  // shared state. That way, when the user clears the search the expansion
  // state they saw during the search sticks rather than snapping back.
  useEffect(() => {
    if (!query) return;
    setCollapsed((c) => {
      let next = c;
      for (const w of workspaces) {
        if (!c[w.id]) continue;
        const wsTabs = tabsByWorkspace.get(w.id) ?? [];
        const hasMatch = wsTabs.some((t) => t.name.toLowerCase().includes(query));
        if (hasMatch) {
          if (next === c) next = { ...c };
          next[w.id] = false;
        }
      }
      return next;
    });
  }, [query, workspaces, tabsByWorkspace]);

  if (!visible) {
    return (
      <div className="flex w-9 flex-col items-center border-r border-(--color-border) bg-(--color-bg-2) p-1">
        <button
          className="flex items-center rounded px-1.5 py-0.5"
          onClick={() => setVisible(true)}
          title="Show sidebar"
        >
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
    );
  }

  async function refresh() {
    const all = await loadAll();
    setWorkspaces(all.workspaces);
    setGroups(all.groups);
    setTabs(all.tabs);
  }

  async function addWorkspace() {
    const name = (await dialogs.prompt('Workspace name', { title: 'New workspace' }))?.trim();
    if (!name) return;
    const now = Date.now();
    const w = {
      id: newId(),
      name,
      orderIndex: workspaces.length,
      createdAt: now,
      updatedAt: now,
    };
    const group: TabGroupRow = {
      id: newId(),
      workspaceId: w.id,
      name: 'Default',
      color: pickColor(0),
      collapsed: false,
      orderIndex: 0,
    };
    await db.workspaces.put(w);
    await db.tabGroups.put(group);
    await refresh();
    setCurrentWsId(w.id);
  }

  async function addTab(workspaceId: string) {
    const name =
      (await dialogs.prompt('Tab name', { title: 'New tab' }))?.trim() || 'untitled';
    const group = await ensureDefaultGroup(workspaceId);
    const existing = await db.tabs.where('tabGroupId').equals(group.id).toArray();
    const nextOrder = existing.reduce((m, t) => Math.max(m, t.orderIndex + 1), 0);
    const t: TabRow = {
      id: newId(),
      tabGroupId: group.id,
      name,
      layout: 'elk',
      orderIndex: nextOrder,
      updatedAt: Date.now(),
    };
    await db.tabs.put(t);
    await db.graphs.put({
      tabId: t.id,
      doc: { idCounter: 1, nodes: [], edges: [], config: {} },
    });
    await refresh();
    setCurrentWsId(workspaceId);
    setCurrentTabId(t.id);
  }

  return (
    <aside className="flex w-72 flex-col border-r border-(--color-border) bg-[#33363c] text-base">
      <div className="flex items-center justify-between border-b border-(--color-border) px-3 py-2">
        <span className="text-sm font-semibold uppercase text-(--color-fg-dim)">Workspaces</span>
        <div className="flex gap-1">
          <button
            className="flex items-center rounded px-2 py-1 hover:bg-black/20"
            onClick={addWorkspace}
            title="Add workspace"
          >
            <AddIcon fontSize="small" />
          </button>
          <button
            className="flex items-center rounded px-2 py-1 hover:bg-black/20"
            onClick={() => setVisible(false)}
            title="Hide sidebar"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
        </div>
      </div>
      <div className="border-b border-(--color-border) px-2 py-2">
        <input
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1.5 text-sm"
          placeholder="search tabs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-auto">
        {workspaces.map((w) => {
          const wsTabs = tabsByWorkspace.get(w.id) ?? [];
          const filtered = query
            ? wsTabs.filter((t) => t.name.toLowerCase().includes(query))
            : wsTabs;
          // Hide entire workspace blocks while searching if they have no
          // matching tabs — much cleaner than leaving empty headers behind.
          if (query && filtered.length === 0) return null;
          const isCurrent = w.id === currentWsId;
          const userCollapsed = !!collapsed[w.id];
          // While searching, force-expand workspaces that have any matches
          // even before the persistence effect runs (avoids a flash of
          // collapsed state on the first keystroke).
          const isExpanded =
            query && filtered.length > 0 ? true : !userCollapsed;
          return (
            <WorkspaceItem
              key={w.id}
              workspace={w}
              isCurrent={isCurrent}
              isExpanded={isExpanded}
              tabs={filtered}
              tabCount={wsTabs.length}
              currentTabId={currentTabId}
              sidePaneTabId={sidePaneTabId}
              allWorkspaces={workspaces}
              onToggle={() =>
                setCollapsed((c) => ({ ...c, [w.id]: !c[w.id] }))
              }
              onAddTab={() => void addTab(w.id)}
              onSelectTab={(t) => {
                if (!isCurrent) setCurrentWsId(w.id);
                setCurrentTabId(t.id);
              }}
              onChanged={refresh}
            />
          );
        })}
      </div>
    </aside>
  );
}

function WorkspaceItem({
  workspace,
  isCurrent,
  isExpanded,
  tabs,
  tabCount,
  currentTabId,
  sidePaneTabId,
  allWorkspaces,
  onToggle,
  onAddTab,
  onSelectTab,
  onChanged,
}: {
  workspace: import('@/persistence/db').WorkspaceRow;
  isCurrent: boolean;
  isExpanded: boolean;
  tabs: TabRow[];
  tabCount: number;
  currentTabId: string | null;
  sidePaneTabId: string | null;
  allWorkspaces: import('@/persistence/db').WorkspaceRow[];
  onToggle: () => void;
  onAddTab: () => void;
  onSelectTab: (t: TabRow) => void;
  onChanged: () => void | Promise<void>;
}) {
  const menuItems: ContextMenuItem[] = [
    { label: 'Add tab', onSelect: onAddTab },
    { label: 'Rename', onSelect: () => void rename() },
    {
      label: 'Delete',
      destructive: true,
      disabled: allWorkspaces.length <= 1,
      onSelect: () => void remove(),
    },
  ];

  async function rename() {
    const name = (
      await dialogs.prompt('Rename workspace', {
        title: 'Rename workspace',
        initial: workspace.name,
      })
    )?.trim();
    if (!name || name === workspace.name) return;
    await db.workspaces.update(workspace.id, { name });
    await onChanged();
  }

  async function remove() {
    if (allWorkspaces.length <= 1) {
      await dialogs.alert("Can't delete the only workspace.", { title: 'Delete workspace' });
      return;
    }
    const ok = await dialogs.confirm(
      `Delete workspace "${workspace.name}" and all its ${tabCount} tabs? This cannot be undone.`,
      { title: 'Delete workspace', destructive: true, confirmLabel: 'Delete' },
    );
    if (!ok) return;
    const groups = await db.tabGroups.where('workspaceId').equals(workspace.id).toArray();
    const groupIds = groups.map((g) => g.id);
    const tabsToDelete = await db.tabs.where('tabGroupId').anyOf(groupIds).toArray();
    const tabIds = tabsToDelete.map((t) => t.id);
    await db.transaction('rw', db.workspaces, db.tabGroups, db.tabs, db.graphs, async () => {
      for (const id of tabIds) {
        await db.tabs.delete(id);
        await db.graphs.delete(id);
      }
      for (const id of groupIds) await db.tabGroups.delete(id);
      await db.workspaces.delete(workspace.id);
    });
    await onChanged();
  }

  return (
    <ContextMenu items={menuItems}>
      <div className="border-b border-(--color-border)">
        <div
          className={`group flex items-center gap-1 px-2 py-1.5 ${isCurrent ? 'bg-(--color-accent)/12' : ''}`}
        >
          <button
            className="flex items-center rounded px-1 py-0.5 opacity-60 hover:opacity-100"
            onClick={onToggle}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </button>
          <button
            className="flex-1 truncate text-left"
            onClick={onToggle}
            title="Click to expand/collapse"
          >
            <span className=" text-sm font-medium">{workspace.name}</span>
            <span className="px-2 text-xs opacity-50">({tabCount})</span>

          </button>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              className="flex items-center rounded px-1.5 py-0.5 hover:bg-(--color-bg-2)"
              onClick={onAddTab}
              title="Add tab"
            >
              <AddIcon fontSize="small" />
            </button>
            <button
              className="flex items-center rounded px-1.5 py-0.5 hover:bg-(--color-bg-2)"
              onClick={() => void rename()}
              title="Rename workspace"
            >
              <EditIcon fontSize="small" />
            </button>
            <button
              className="flex items-center rounded px-1.5 py-0.5 hover:bg-(--color-bg-2)"
              onClick={() => void remove()}
              title="Delete workspace"
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="pb-1 pl-4 pr-2">
            {tabs.length === 0 && (
              <div className="px-2 py-1 text-xs opacity-50">no tabs</div>
            )}
            {tabs.map((t) => (
              <SidebarTab
                key={t.id}
                tab={t}
                isCurrent={t.id === currentTabId}
                isInSidePane={t.id === sidePaneTabId}
                onSelect={() => onSelectTab(t)}
                currentWorkspaceId={workspace.id}
                allWorkspaces={allWorkspaces}
                onChanged={onChanged}
              />
            ))}
          </div>
        )}
      </div>
    </ContextMenu>
  );
}

function SidebarTab({
  tab,
  isCurrent,
  isInSidePane,
  onSelect,
  currentWorkspaceId,
  allWorkspaces,
  onChanged,
}: {
  tab: TabRow;
  isCurrent: boolean;
  isInSidePane: boolean;
  onSelect: () => void;
  currentWorkspaceId: string;
  allWorkspaces: import('@/persistence/db').WorkspaceRow[];
  onChanged: () => void | Promise<void>;
}) {
  const setSidePane = useSetAtom(sidePaneTabIdAtom);

  async function rename() {
    const name = (
      await dialogs.prompt('Rename tab', { title: 'Rename tab', initial: tab.name })
    )?.trim();
    if (!name || name === tab.name) return;
    await db.tabs.update(tab.id, { name });
    await onChanged();
  }

  async function remove() {
    const ok = await dialogs.confirm(`Remove tab "${tab.name}"?`, {
      title: 'Remove tab',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    await db.tabs.delete(tab.id);
    await db.graphs.delete(tab.id);
    await onChanged();
  }

  async function showLinkedProjects() {
    const g = await db.graphs.get(tab.id);
    const projects = new Set<string>();
    if (g?.doc) {
      for (const n of g.doc.nodes) {
        const p = (n.extra as { project?: string }).project;
        if (p) projects.add(p);
      }
    }
    if (projects.size === 0) {
      await dialogs.alert(`Tab "${tab.name}" has no linked projects.`, {
        title: 'Linked projects',
      });
    } else {
      await dialogs.alert([...projects].join('\n'), {
        title: `Linked projects in "${tab.name}"`,
      });
    }
  }

  async function moveToWorkspace(workspaceId: string) {
    const group = await ensureDefaultGroup(workspaceId);
    const existing = await db.tabs.where('tabGroupId').equals(group.id).toArray();
    const nextOrder = existing.reduce((m, t) => Math.max(m, t.orderIndex + 1), 0);
    await db.tabs.update(tab.id, { tabGroupId: group.id, orderIndex: nextOrder });
    await onChanged();
  }

  const moveSubmenu = allWorkspaces
    .filter((ws) => ws.id !== currentWorkspaceId)
    .map((ws) => ({
      label: ws.name,
      onSelect: () => void moveToWorkspace(ws.id),
    }));
  const menuItems: ContextMenuItem[] = [
    { label: 'Rename', onSelect: () => void rename() },
    {
      label: isInSidePane ? 'Close side pane' : 'Open in side pane',
      onSelect: () => setSidePane(isInSidePane ? null : tab.id),
    },
    ...(moveSubmenu.length > 0
      ? [{ label: 'Move to workspace', onSelect: () => { }, submenu: moveSubmenu }]
      : []),
    { label: 'Linked projects', onSelect: () => void showLinkedProjects() },
    { label: 'Remove', destructive: true, onSelect: () => void remove() },
  ];

  // Encode pane membership in the tab background. Stronger tint for the
  // primary pane, lighter tint for the side pane, strongest when both.
  const paneTint =
    isCurrent && isInSidePane
      ? 'bg-(--color-accent)/30 font-medium'
      : isCurrent
        ? 'bg-(--color-accent)/20 font-medium'
        : isInSidePane
          ? 'bg-(--color-accent)/10'
          : 'hover:bg-black/20';
  const paneTitle =
    isCurrent && isInSidePane
      ? 'Open in both panes'
      : isCurrent
        ? 'Open in primary pane'
        : isInSidePane
          ? 'Open in side pane'
          : tab.name;

  return (
    <ContextMenu items={menuItems}>
      <button
        className={`group/tab flex w-full items-center gap-1.5 truncate rounded px-1.5 py-1 text-left text-sm ${paneTint}`}
        onClick={onSelect}
        title={paneTitle}
      >
        <span className="flex-1 truncate">{tab.name}</span>
      </button>
    </ContextMenu>
  );
}
