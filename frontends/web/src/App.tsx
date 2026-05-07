import { Provider, useAtomValue, useSetAtom, useAtom } from 'jotai';
import { appOverlayAtom } from '@/state/appOverlay';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getStore } from '@/state/store';
import { theme } from '@/ui/theme';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  ensureDefaultWorkspace,
  loadAll,
  pruneEmptyWorkspaces,
  sidePaneTabIdAtom,
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
import { CommandPalette } from './ui/CommandPalette';
import { NodeSearchPalette } from './ui/NodeSearchPalette';
import { TabJumpPalette } from './ui/TabJumpPalette';
import { readUrlState, writeUrlState } from './routing/url';
import { FileDropImport } from './ui/FileDropImport';

function Inner() {
  const setWorkspaces = useSetAtom(workspacesAtom);
  const setGroups = useSetAtom(tabGroupsAtom);
  const setTabs = useSetAtom(tabsAtom);
  const [currentWsId, setCurrentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentTabId, setCurrentTabId] = useAtom(currentTabIdAtom);
  const [bootDone, setBootDone] = useState(false);
  const overlay = useAtomValue(appOverlayAtom);
  const setOverlay = useSetAtom(appOverlayAtom);

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

        const store = getStore();
        const persistedWs = store.get(currentWorkspaceIdAtom);
        const persistedTab = store.get(currentTabIdAtom);
        if (!persistedWs || !workspaces.find((w) => w.id === persistedWs)) {
          setCurrentWsId(ensured.workspaceId);
        }
        if (!persistedTab || !tabs.find((t) => t.id === persistedTab)) {
          setCurrentTabId(ensured.tabId);
        }

        const url = readUrlState();
        if (url.workspace && workspaces.some((w) => w.id === url.workspace)) {
          setCurrentWsId(url.workspace);
        }
        if (url.tab && tabs.some((t) => t.id === url.tab)) {
          setCurrentTabId(url.tab);
        }
        if (url.pane2 && tabs.some((t) => t.id === url.pane2)) {
          store.set(sidePaneTabIdAtom, url.pane2);
        }
      } finally {
        setBootDone(true);
      }
    })();
  }, [setCurrentWsId, setCurrentTabId, setBootDone, setWorkspaces, setGroups, setTabs]);

  // URL state — read on boot, write on changes
  const sidePane = useAtomValue(sidePaneTabIdAtom);
  useEffect(() => {
    if (!bootDone) return;
    writeUrlState({
      workspace: currentWsId ?? null,
      tab: currentTabId ?? null,
      pane2: sidePane ?? null,
    });
  }, [bootDone, currentWsId, currentTabId, sidePane]);

  useHotkeys();

  if (!bootDone) {
    return <div className="flex h-full items-center justify-center text-sm opacity-60">loading…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <SplitView />
        <Inspector />
      </div>
      <CommandPalette />
      <TabJumpPalette />
      <NodeSearchPalette />
      {overlay === 'token' && <TokenDialog onClose={() => setOverlay('none')} />}
      {overlay === 'help' && <HelpDialog onClose={() => setOverlay('none')} />}
      <DialogHost />
      <FileDropImport />
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
