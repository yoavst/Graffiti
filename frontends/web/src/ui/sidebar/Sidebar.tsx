import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
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
import { ContextMenu, type ContextMenuState } from '@/ui/ContextMenu';

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

  if (!visible) {
    return (
      <div className="flex w-8 flex-col items-center border-r border-(--color-border) bg-(--color-bg-2) p-1">
        <button
          className="rounded px-1 text-xs"
          onClick={() => setVisible(true)}
          title="Show sidebar"
        >
          ▸
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
    const name = prompt('Workspace name')?.trim();
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
    const name = prompt('Tab name')?.trim() || 'untitled';
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

  const query = search.trim().toLowerCase();

  return (
    <aside className="flex w-64 flex-col border-r border-(--color-border) bg-(--color-bg-2) text-sm">
      <div className="flex items-center justify-between border-b border-(--color-border) px-2 py-1">
        <span className="font-semibold uppercase text-xs text-(--color-fg-dim)">Workspaces</span>
        <div className="flex gap-1">
          <button className="text-xs" onClick={addWorkspace} title="Add workspace">
            +
          </button>
          <button className="text-xs" onClick={() => setVisible(false)} title="Hide sidebar">
            ◂
          </button>
        </div>
      </div>
      <div className="border-b border-(--color-border) px-2 py-1">
        <input
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-0.5 text-xs"
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
          // While searching, force-expand workspaces that have any matches so
          // the user can see results without manually opening each one.
          const isCurrent = w.id === currentWsId;
          const userCollapsed = !!collapsed[w.id];
          const isExpanded = query ? filtered.length > 0 : !userCollapsed;
          return (
            <WorkspaceItem
              key={w.id}
              workspace={w}
              isCurrent={isCurrent}
              isExpanded={isExpanded}
              tabs={filtered}
              tabCount={wsTabs.length}
              currentTabId={currentTabId}
              allWorkspaces={workspaces}
              onToggle={() =>
                setCollapsed((c) => ({ ...c, [w.id]: !c[w.id] }))
              }
              onActivate={() => setCurrentWsId(w.id)}
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
  allWorkspaces,
  onToggle,
  onActivate,
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
  allWorkspaces: import('@/persistence/db').WorkspaceRow[];
  onToggle: () => void;
  onActivate: () => void;
  onAddTab: () => void;
  onSelectTab: (t: TabRow) => void;
  onChanged: () => void | Promise<void>;
}) {
  async function rename() {
    const name = prompt('Rename workspace', workspace.name)?.trim();
    if (!name || name === workspace.name) return;
    await db.workspaces.update(workspace.id, { name });
    await onChanged();
  }

  async function remove() {
    if (allWorkspaces.length <= 1) {
      alert("Can't delete the only workspace.");
      return;
    }
    if (
      !confirm(
        `Delete workspace "${workspace.name}" and all its ${tabCount} tabs? This cannot be undone.`,
      )
    ) {
      return;
    }
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
    <div className="border-b border-(--color-border)">
      <div
        className={`group flex items-center gap-1 px-2 py-1 ${isCurrent ? 'bg-(--color-bg-3)' : ''}`}
      >
        <button
          className="px-0.5 text-xs opacity-60 hover:opacity-100"
          onClick={onToggle}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          className="flex-1 truncate text-left font-medium"
          onClick={onActivate}
          onDoubleClick={() => void rename()}
          title={isCurrent ? 'Active workspace' : 'Click to switch to this workspace'}
        >
          {workspace.name}
        </button>
        <span className="text-[10px] opacity-50">{tabCount}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
          <button className="text-xs" onClick={onAddTab} title="Add tab">
            +
          </button>
          <button className="text-xs" onClick={() => void rename()} title="Rename workspace">
            ✎
          </button>
          <button className="text-xs" onClick={() => void remove()} title="Delete workspace">
            🗑
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="pb-1 pl-4 pr-2">
          {tabs.length === 0 && (
            <div className="px-2 py-1 text-[10px] opacity-50">no tabs</div>
          )}
          {tabs.map((t) => (
            <SidebarTab
              key={t.id}
              tab={t}
              isCurrent={t.id === currentTabId}
              onSelect={() => onSelectTab(t)}
              allWorkspaces={allWorkspaces}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarTab({
  tab,
  isCurrent,
  onSelect,
  allWorkspaces,
  onChanged,
}: {
  tab: TabRow;
  isCurrent: boolean;
  onSelect: () => void;
  allWorkspaces: import('@/persistence/db').WorkspaceRow[];
  onChanged: () => void | Promise<void>;
}) {
  const setSidePane = useSetAtom(sidePaneTabIdAtom);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  async function rename() {
    const name = prompt('Rename tab', tab.name)?.trim();
    if (!name || name === tab.name) return;
    await db.tabs.update(tab.id, { name });
    await onChanged();
  }

  async function remove() {
    if (!confirm(`Remove tab "${tab.name}"?`)) return;
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
      alert(`Tab "${tab.name}" has no linked projects.`);
    } else {
      alert(`Linked projects in "${tab.name}":\n\n${[...projects].join('\n')}`);
    }
  }

  async function moveToWorkspace(workspaceId: string) {
    const group = await ensureDefaultGroup(workspaceId);
    const existing = await db.tabs.where('tabGroupId').equals(group.id).toArray();
    const nextOrder = existing.reduce((m, t) => Math.max(m, t.orderIndex + 1), 0);
    await db.tabs.update(tab.id, { tabGroupId: group.id, orderIndex: nextOrder });
    await onChanged();
  }

  async function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Build the "Move to" submenu with one entry per other workspace.
    const currentGroup = await db.tabGroups.get(tab.tabGroupId);
    const currentWsId = currentGroup?.workspaceId;
    const moveSubmenu = allWorkspaces
      .filter((ws) => ws.id !== currentWsId)
      .map((ws) => ({
        label: ws.name,
        onSelect: () => void moveToWorkspace(ws.id),
      }));
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Rename', onSelect: () => void rename() },
        { label: 'Open in side pane', onSelect: () => setSidePane(tab.id) },
        ...(moveSubmenu.length > 0
          ? [{ label: 'Move to workspace', onSelect: () => {}, submenu: moveSubmenu }]
          : []),
        { label: 'Linked projects', onSelect: () => void showLinkedProjects() },
        { label: 'Remove', destructive: true, onSelect: () => void remove() },
      ],
    });
  }

  return (
    <>
      <button
        className={`group/tab flex w-full items-center gap-1 truncate text-xs px-1 py-0.5 rounded text-left ${
          isCurrent ? 'bg-(--color-bg-3)' : 'hover:bg-(--color-bg-3)'
        }`}
        onClick={onSelect}
        onDoubleClick={() => void rename()}
        onContextMenu={(e) => void openMenu(e)}
        title={tab.name}
      >
        <span className="flex-1 truncate">{tab.name}</span>
      </button>
      <ContextMenu state={menu} onClose={() => setMenu(null)} />
    </>
  );
}
