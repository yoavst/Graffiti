import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { startTransition, useEffect, useMemo, useState } from 'react';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultGroupInStore,
  findWorkspaceIdForTab,
  reconcileNavigationPointers,
  removeGraphStorageForTab,
  sidePaneTabIdAtom,
  tabGroupsAtom,
  tabsAtom,
  updateWorkspaceBundle,
  workspaceBundleAtomFamily,
  workspaceIdsAtom,
  workspacesAtom,
} from '@/state/workspaces';
import { workspaceStorageKey } from '@/state/storageKeys';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import { newId } from '@/util/ids';
import { emptyGraphDoc, pickColor, type TabGroupRow, type TabRow, type WorkspaceRow } from '@/state/workspaceTypes';
import { sidebarVisibleAtom } from '@/state/settings';
import { ContextMenu, type ContextMenuItem } from '@/ui/ContextMenu';
import { dialogs } from '@/ui/dialogs/Dialogs';

export function Sidebar() {
  const store = useStore();
  const visible = useAtomValue(sidebarVisibleAtom);
  const setVisible = useSetAtom(sidebarVisibleAtom);
  const workspaces = useAtomValue(workspacesAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const tabs = useAtomValue(tabsAtom);
  const [currentWsId, setCurrentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentTabId, setCurrentTabId] = useAtom(currentTabIdAtom);
  const sidePaneTabId = useAtomValue(sidePaneTabIdAtom);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({}));
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    if (!currentTabId) return;
    const t = tabs.find((x) => x.id === currentTabId);
    if (!t) return;
    const g = groups.find((x) => x.id === t.tabGroupId);
    if (!g) return;
    if (g.workspaceId !== currentWsId) setCurrentWsId(g.workspaceId);
  }, [currentTabId, tabs, groups, currentWsId, setCurrentWsId]);

  const query = search.trim().toLowerCase();

  useEffect(() => {
    if (!query) return;
    startTransition(() => {
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

  async function addWorkspace() {
    const name = (await dialogs.prompt('Workspace name', { title: 'New workspace' }))?.trim();
    if (!name) return;
    const now = Date.now();
    const workspaceId = newId();
    const group: TabGroupRow = {
      id: newId(),
      workspaceId,
      name: 'Default',
      color: pickColor(0),
      collapsed: false,
      orderIndex: 0,
    };
    const w: WorkspaceRow = {
      id: workspaceId,
      name,
      orderIndex: store.get(workspaceIdsAtom).length,
      createdAt: now,
      updatedAt: now,
    };
    store.set(workspaceIdsAtom, [...store.get(workspaceIdsAtom), workspaceId]);
    store.set(workspaceBundleAtomFamily(workspaceId), {
      workspace: w,
      groups: [group],
      tabs: [],
    });
    setCurrentWsId(workspaceId);
  }

  async function addTab(workspaceId: string) {
    const name =
      (await dialogs.prompt('Tab name', { title: 'New tab' }))?.trim() || 'untitled';
    const group = ensureDefaultGroupInStore(store, workspaceId);
    const b = store.get(workspaceBundleAtomFamily(workspaceId));
    const existing = b.tabs.filter((t) => t.tabGroupId === group.id);
    const nextOrder = existing.reduce((m, t) => Math.max(m, t.orderIndex + 1), 0);
    const t: TabRow = {
      id: newId(),
      tabGroupId: group.id,
      name,
      layout: 'elk',
      orderIndex: nextOrder,
      updatedAt: Date.now(),
    };
    updateWorkspaceBundle(store, workspaceId, (cur) => ({
      ...cur,
      tabs: [...cur.tabs, t],
    }));
    store.set(graphDocAtomFamily(t.id), emptyGraphDoc());
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
            onClick={() => void addWorkspace()}
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
        <TextField
          fullWidth
          size="small"
          variant="outlined"
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
          if (query && filtered.length === 0) return null;
          const isCurrent = w.id === currentWsId;
          const userCollapsed = !!collapsed[w.id];
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
}: {
  workspace: WorkspaceRow;
  isCurrent: boolean;
  isExpanded: boolean;
  tabs: TabRow[];
  tabCount: number;
  currentTabId: string | null;
  sidePaneTabId: string | null;
  allWorkspaces: WorkspaceRow[];
  onToggle: () => void;
  onAddTab: () => void;
  onSelectTab: (t: TabRow) => void;
}) {
  const store = useStore();

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
    updateWorkspaceBundle(store, workspace.id, (b) => ({
      ...b,
      workspace: { ...b.workspace, name, updatedAt: Date.now() },
    }));
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
    const b = store.get(workspaceBundleAtomFamily(workspace.id));
    for (const t of b.tabs) {
      removeGraphStorageForTab(store, t.id);
    }
    localStorage.removeItem(workspaceStorageKey(workspace.id));
    workspaceBundleAtomFamily.remove(workspace.id);
    store.set(
      workspaceIdsAtom,
      store.get(workspaceIdsAtom).filter((id) => id !== workspace.id),
    );
    reconcileNavigationPointers(store);
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
}: {
  tab: TabRow;
  isCurrent: boolean;
  isInSidePane: boolean;
  onSelect: () => void;
  currentWorkspaceId: string;
  allWorkspaces: WorkspaceRow[];
}) {
  const store = useStore();
  const setSidePane = useSetAtom(sidePaneTabIdAtom);

  async function rename() {
    const name = (
      await dialogs.prompt('Rename tab', { title: 'Rename tab', initial: tab.name })
    )?.trim();
    if (!name || name === tab.name) return;
    const wid = findWorkspaceIdForTab(store, tab.id);
    if (!wid) return;
    updateWorkspaceBundle(store, wid, (b) => ({
      ...b,
      tabs: b.tabs.map((x) => (x.id === tab.id ? { ...x, name } : x)),
    }));
  }

  async function remove() {
    const ok = await dialogs.confirm(`Remove tab "${tab.name}"?`, {
      title: 'Remove tab',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const wid = findWorkspaceIdForTab(store, tab.id);
    if (!wid) return;
    removeGraphStorageForTab(store, tab.id);
    updateWorkspaceBundle(store, wid, (b) => ({
      ...b,
      tabs: b.tabs.filter((x) => x.id !== tab.id),
    }));
    reconcileNavigationPointers(store);
  }

  async function showLinkedProjects() {
    const doc = store.get(graphDocAtomFamily(tab.id));
    const projects = new Set<string>();
    for (const n of doc.nodes) {
      const p = (n.extra as { project?: string }).project;
      if (p) projects.add(p);
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
    const sourceWid = findWorkspaceIdForTab(store, tab.id);
    if (!sourceWid || sourceWid === workspaceId) return;
    const group = ensureDefaultGroupInStore(store, workspaceId);
    const targetBundle = store.get(workspaceBundleAtomFamily(workspaceId));
    const existing = targetBundle.tabs.filter((x) => x.tabGroupId === group.id);
    const nextOrder = existing.reduce((m, x) => Math.max(m, x.orderIndex + 1), 0);

    updateWorkspaceBundle(store, sourceWid, (b) => ({
      ...b,
      tabs: b.tabs.filter((x) => x.id !== tab.id),
    }));
    updateWorkspaceBundle(store, workspaceId, (b) => ({
      ...b,
      tabs: [
        ...b.tabs,
        { ...tab, tabGroupId: group.id, orderIndex: nextOrder, updatedAt: Date.now() },
      ],
    }));
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
