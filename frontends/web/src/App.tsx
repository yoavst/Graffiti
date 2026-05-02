import { Provider, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getStore } from '@/state/store';
import { theme } from '@/ui/theme';
import {
  activeTabIdAtom,
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultWorkspace,
  loadAll,
  pruneEmptyWorkspaces,
  tabGroupsAtom,
  tabsAtom,
  workspacesAtom,
} from '@/state/workspaces';
import { migrateLegacyIfNeeded } from '@/persistence/migrations';
import { Header } from './ui/Header';
import { Sidebar } from './ui/sidebar/Sidebar';
import { Inspector } from './ui/Inspector';
import { SplitView } from './ui/SplitView';
import { TokenDialog } from './ui/dialogs/TokenDialog';
import { HelpDialog } from './ui/dialogs/HelpDialog';
import { DialogHost } from './ui/dialogs/Dialogs';
import { useHotkeys } from './commands/hotkeys';
import { setCurrentTab } from './state/registry';
import { CommandPalette } from './ui/CommandPalette';
import { readUrlState, writeUrlState } from './routing/url';
import { sidePaneTabIdAtom } from './state/workspaces';
import { importFile } from './persistence/importExport';
import { db } from './persistence/db';
import { getCurrentTab as registryGetCurrentTab } from './state/registry';
import { loadAll as workspacesLoadAll } from './state/workspaces';
import { useAtom } from 'jotai';

function Inner() {
  const setWorkspaces = useSetAtom(workspacesAtom);
  const setGroups = useSetAtom(tabGroupsAtom);
  const setTabs = useSetAtom(tabsAtom);
  const [currentWsId, setCurrentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentTabId, setCurrentTabId] = useAtom(currentTabIdAtom);
  const [bootDone, setBootDone] = useState(false);

  const [tokenOpen, setTokenOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Boot: migrate legacy data, ensure a default workspace exists, load atoms.
  useEffect(() => {
    void (async () => {
      try {
        await migrateLegacyIfNeeded();
        const ensured = await ensureDefaultWorkspace();
        await pruneEmptyWorkspaces();
        const { workspaces, groups, tabs } = await loadAll();
        setWorkspaces(workspaces);
        setGroups(groups);
        setTabs(tabs);
        if (!currentWsId || !workspaces.find((w) => w.id === currentWsId)) {
          setCurrentWsId(ensured.workspaceId);
        }
        if (!currentTabId || !tabs.find((t) => t.id === currentTabId)) {
          setCurrentTabId(ensured.tabId);
        }
      } finally {
        setBootDone(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the *active* tab (the one in the pane the user last clicked) for
  // global hotkeys, network dispatch, and MCP — not just the primary pane.
  const activeTabId = useAtomValue(activeTabIdAtom);
  useEffect(() => {
    setCurrentTab(activeTabId ?? null);
  }, [activeTabId]);

  // URL state — read on boot, write on changes
  const [sidePane, setSidePane] = useAtom(sidePaneTabIdAtom);
  useEffect(() => {
    if (!bootDone) return;
    const url = readUrlState();
    if (url.workspace) setCurrentWsId(url.workspace);
    if (url.tab) setCurrentTabId(url.tab);
    if (url.pane2) setSidePane(url.pane2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootDone]);
  useEffect(() => {
    if (!bootDone) return;
    writeUrlState({
      workspace: currentWsId ?? null,
      tab: currentTabId ?? null,
      pane2: sidePane ?? null,
    });
  }, [bootDone, currentWsId, currentTabId, sidePane]);

  useHotkeys({ onOpenToken: () => setTokenOpen(true), onOpenHelp: () => setHelpOpen(true) });

  // Drag-and-drop import.
  //
  // Capture-phase listeners on `window` win against React Flow's own drag
  // handling on the canvas. We always preventDefault on dragenter/dragover
  // (otherwise the browser refuses the drop) and surface a banner so the
  // user can see something is happening.
  const [dragHover, setDragHover] = useState(false);
  useEffect(() => {
    function isFileDrag(e: DragEvent): boolean {
      const types = e.dataTransfer?.types;
      if (!types) return false;
      for (let i = 0; i < types.length; i++) {
        if (types[i] === 'Files') return true;
      }
      return false;
    }
    function onDragEnter(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDragHover(true);
    }
    function onDragOver(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
    function onDragLeave(e: DragEvent) {
      // Only clear when leaving the window
      if ((e as DragEvent & { relatedTarget?: EventTarget | null }).relatedTarget == null) {
        setDragHover(false);
      }
    }
    async function onDrop(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setDragHover(false);

      const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : [];
      if (files.length === 0) return;

      // Resolve the target group: use the current tab's group if available,
      // otherwise fall back to the first group in the current workspace.
      let targetGroupId: string | null = null;
      const cur = registryGetCurrentTab();
      if (cur) {
        const tab = await db.tabs.get(cur.tabId);
        if (tab) targetGroupId = tab.tabGroupId;
      }
      if (!targetGroupId) {
        const tabIdFromAtom = getStore().get(currentTabIdAtom);
        if (tabIdFromAtom) {
          const tab = await db.tabs.get(tabIdFromAtom);
          if (tab) targetGroupId = tab.tabGroupId;
        }
      }
      if (!targetGroupId) {
        const wid = getStore().get(currentWorkspaceIdAtom);
        if (wid) {
          const g = await db.tabGroups.where('workspaceId').equals(wid).first();
          if (g) targetGroupId = g.id;
        }
      }
      if (!targetGroupId) {
        console.warn('drop: no target tab group');
        return;
      }

      let firstImportedTabId: string | null = null;
      for (const f of files) {
        try {
          const importedIds = await importFile(f, targetGroupId);
          if (!firstImportedTabId && importedIds[0]) firstImportedTabId = importedIds[0];
        } catch (err) {
          console.error('import failed for', f.name, err);
        }
      }

      const all = await workspacesLoadAll();
      setTabs(all.tabs);
      if (firstImportedTabId) setCurrentTabId(firstImportedTabId);
    }

    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('dragleave', onDragLeave, true);
    window.addEventListener('drop', onDrop, true);
    return () => {
      window.removeEventListener('dragenter', onDragEnter, true);
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('dragleave', onDragLeave, true);
      window.removeEventListener('drop', onDrop, true);
    };
  }, [setTabs, setCurrentTabId]);

  if (!bootDone) {
    return <div className="flex h-full items-center justify-center text-sm opacity-60">loading…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <Header onOpenToken={() => setTokenOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <SplitView />
        <Inspector />
      </div>
      <CommandPalette
        onOpenHelp={() => setHelpOpen(true)}
        onOpenToken={() => setTokenOpen(true)}
      />
      {tokenOpen && <TokenDialog onClose={() => setTokenOpen(false)} />}
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
      <DialogHost />
      {dragHover && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-(--color-accent)/20 text-2xl font-semibold text-(--color-accent) ring-4 ring-(--color-accent) ring-inset">
          Drop to import
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <Provider store={getStore()}>
        <Inner />
      </Provider>
    </ThemeProvider>
  );
}
