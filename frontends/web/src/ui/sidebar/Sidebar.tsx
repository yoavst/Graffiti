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
  currentGraphIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultGroupInStore,
  findWorkspaceIdForGraph,
  reconcileNavigationPointers,
  removeGraphStorageForGraph,
  sidePaneGraphIdAtom,
  tabGroupsAtom,
  graphsAtom,
  updateWorkspaceBundle,
  workspaceBundleAtomFamily,
  workspaceIdsAtom,
  workspacesAtom,
} from '@/state/workspaces';
import { workspaceStorageKey } from '@/state/storageKeys';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import { newId } from '@/util/ids';
import { emptyGraphDoc, pickColor, type GraphGroupRow, type GraphRow, type WorkspaceRow } from '@/state/workspaceTypes';
import { sidebarVisibleAtom } from '@/state/settings';
import { ContextMenu, type ContextMenuItem } from '@/ui/ContextMenu';
import { dialogs } from '@/ui/dialogs/Dialogs';

export function Sidebar() {
  const store = useStore();
  const visible = useAtomValue(sidebarVisibleAtom);
  const setVisible = useSetAtom(sidebarVisibleAtom);
  const workspaces = useAtomValue(workspacesAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const graphs = useAtomValue(graphsAtom);
  const [currentWsId, setCurrentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentGraphId, setCurrentGraphId] = useAtom(currentGraphIdAtom);
  const sidePaneGraphId = useAtomValue(sidePaneGraphIdAtom);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({}));
  const [search, setSearch] = useState('');

  const tabsByWorkspace = useMemo(() => {
    const groupToWs = new Map<string, string>();
    for (const g of groups) groupToWs.set(g.id, g.workspaceId);
    const out = new Map<string, GraphRow[]>();
    for (const t of graphs) {
      const wsId = groupToWs.get(t.graphGroupId);
      if (!wsId) continue;
      const arr = out.get(wsId) ?? [];
      arr.push(t);
      out.set(wsId, arr);
    }
    for (const arr of out.values()) arr.sort((a, b) => a.orderIndex - b.orderIndex);
    return out;
  }, [graphs, groups]);

  useEffect(() => {
    if (!currentGraphId) return;
    const t = graphs.find((x) => x.id === currentGraphId);
    if (!t) return;
    const g = groups.find((x) => x.id === t.graphGroupId);
    if (!g) return;
    if (g.workspaceId !== currentWsId) setCurrentWsId(g.workspaceId);
  }, [currentGraphId, graphs, groups, currentWsId, setCurrentWsId]);

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
    const group: GraphGroupRow = {
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
      graphs: [],
    });
    setCurrentWsId(workspaceId);
  }

  async function addGraph(workspaceId: string) {
    const name =
      (await dialogs.prompt('Graph name', { title: 'New graph' }))?.trim() || 'untitled';
    const group = ensureDefaultGroupInStore(store, workspaceId);
    const b = store.get(workspaceBundleAtomFamily(workspaceId));
    const existing = b.graphs.filter((g) => g.graphGroupId === group.id);
    const nextOrder = existing.reduce((m, g) => Math.max(m, g.orderIndex + 1), 0);
    const g: GraphRow = {
      id: newId(),
      graphGroupId: group.id,
      name,
      layout: 'elk',
      orderIndex: nextOrder,
      updatedAt: Date.now(),
    };
    updateWorkspaceBundle(store, workspaceId, (cur) => ({
      ...cur,
      graphs: [...cur.graphs, g],
    }));
    store.set(graphDocAtomFamily(g.id), emptyGraphDoc());
    setCurrentWsId(workspaceId);
    setCurrentGraphId(g.id);
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
          placeholder="search graphs"
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
              graphs={filtered}
              graphCount={wsTabs.length}
              currentGraphId={currentGraphId}
              sidePaneGraphId={sidePaneGraphId}
              allWorkspaces={workspaces}
              onToggle={() =>
                setCollapsed((c) => ({ ...c, [w.id]: !c[w.id] }))
              }
              onAddGraph={() => void addGraph(w.id)}
              onSelectGraph={(g) => {
                if (!isCurrent) setCurrentWsId(w.id);
                setCurrentGraphId(g.id);
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
  graphs,
  graphCount,
  currentGraphId,
  sidePaneGraphId,
  allWorkspaces,
  onToggle,
  onAddGraph,
  onSelectGraph,
}: {
  workspace: WorkspaceRow;
  isCurrent: boolean;
  isExpanded: boolean;
  graphs: GraphRow[];
  graphCount: number;
  currentGraphId: string | null;
  sidePaneGraphId: string | null;
  allWorkspaces: WorkspaceRow[];
  onToggle: () => void;
  onAddGraph: () => void;
  onSelectGraph: (g: GraphRow) => void;
}) {
  const store = useStore();

  const menuItems: ContextMenuItem[] = [
    { label: 'Add graph', onSelect: onAddGraph },
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
      `Delete workspace "${workspace.name}" and all its ${graphCount} graphs? This cannot be undone.`,
      { title: 'Delete workspace', destructive: true, confirmLabel: 'Delete' },
    );
    if (!ok) return;
    const b = store.get(workspaceBundleAtomFamily(workspace.id));
    for (const g of b.graphs) {
      removeGraphStorageForGraph(store, g.id);
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
            <span className="px-2 text-xs opacity-50">({graphCount})</span>
          </button>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              className="flex items-center rounded px-1.5 py-0.5 hover:bg-(--color-bg-2)"
              onClick={onAddGraph}
              title="Add graph"
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
            {graphs.length === 0 && (
              <div className="px-2 py-1 text-xs opacity-50">no graphs</div>
            )}
            {graphs.map((g) => (
              <SidebarGraph
                key={g.id}
                graph={g}
                isCurrent={g.id === currentGraphId}
                isInSidePane={g.id === sidePaneGraphId}
                onSelect={() => onSelectGraph(g)}
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

function SidebarGraph({
  graph,
  isCurrent,
  isInSidePane,
  onSelect,
  currentWorkspaceId,
  allWorkspaces,
}: {
  graph: GraphRow;
  isCurrent: boolean;
  isInSidePane: boolean;
  onSelect: () => void;
  currentWorkspaceId: string;
  allWorkspaces: WorkspaceRow[];
}) {
  const store = useStore();
  const setSidePane = useSetAtom(sidePaneGraphIdAtom);

  async function rename() {
    const name = (
      await dialogs.prompt('Rename graph', { title: 'Rename graph', initial: graph.name })
    )?.trim();
    if (!name || name === graph.name) return;
    const wid = findWorkspaceIdForGraph(store, graph.id);
    if (!wid) return;
    updateWorkspaceBundle(store, wid, (b) => ({
      ...b,
      graphs: b.graphs.map((x) => (x.id === graph.id ? { ...x, name } : x)),
    }));
  }

  async function remove() {
    const ok = await dialogs.confirm(`Remove graph "${graph.name}"?`, {
      title: 'Remove graph',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const wid = findWorkspaceIdForGraph(store, graph.id);
    if (!wid) return;
    removeGraphStorageForGraph(store, graph.id);
    updateWorkspaceBundle(store, wid, (b) => ({
      ...b,
      graphs: b.graphs.filter((x) => x.id !== graph.id),
    }));
    reconcileNavigationPointers(store);
  }

  async function showLinkedProjects() {
    const doc = store.get(graphDocAtomFamily(graph.id));
    const projects = new Set<string>();
    for (const n of doc.nodes) {
      const p = (n.extra as { project?: string }).project;
      if (p) projects.add(p);
    }
    if (projects.size === 0) {
      await dialogs.alert(`Graph "${graph.name}" has no linked projects.`, {
        title: 'Linked projects',
      });
    } else {
      await dialogs.alert([...projects].join('\n'), {
        title: `Linked projects in "${graph.name}"`,
      });
    }
  }

  async function moveToWorkspace(workspaceId: string) {
    const sourceWid = findWorkspaceIdForGraph(store, graph.id);
    if (!sourceWid || sourceWid === workspaceId) return;
    const group = ensureDefaultGroupInStore(store, workspaceId);
    const targetBundle = store.get(workspaceBundleAtomFamily(workspaceId));
    const existing = targetBundle.graphs.filter((x) => x.graphGroupId === group.id);
    const nextOrder = existing.reduce((m, x) => Math.max(m, x.orderIndex + 1), 0);

    updateWorkspaceBundle(store, sourceWid, (b) => ({
      ...b,
      graphs: b.graphs.filter((x) => x.id !== graph.id),
    }));
    updateWorkspaceBundle(store, workspaceId, (b) => ({
      ...b,
      graphs: [...b.graphs, { ...graph, graphGroupId: group.id, orderIndex: nextOrder, updatedAt: Date.now() }],
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
      onSelect: () => setSidePane(isInSidePane ? null : graph.id),
    },
    ...(moveSubmenu.length > 0
      ? [{ label: 'Move to workspace', onSelect: () => {}, submenu: moveSubmenu }]
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
          : graph.name;

  return (
    <ContextMenu items={menuItems}>
      <button
        className={`group/graph flex w-full items-center gap-1.5 truncate rounded px-1.5 py-1 text-left text-sm ${paneTint}`}
        onClick={onSelect}
        title={paneTitle}
      >
        <span className="flex-1 truncate">{graph.name}</span>
      </button>
    </ContextMenu>
  );
}
