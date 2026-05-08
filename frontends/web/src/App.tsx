import { Provider, useAtomValue, useSetAtom, useAtom } from 'jotai';
import { appOverlayAtom } from '@/state/appOverlay';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getStore } from '@/state/store';
import { theme } from '@/ui/theme';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  sidePaneTabIdAtom,
} from '@/state/workspaces';
import { initPersistence } from '@/state/persistenceInit';
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
import { writeUrlState } from './routing/url';
import { FileDropImport } from './ui/FileDropImport';

function Inner() {
  const [currentWsId] = useAtom(currentWorkspaceIdAtom);
  const [currentTabId] = useAtom(currentTabIdAtom);
  const [overlay, setOverlay] = useAtom(appOverlayAtom);
  const sidePane = useAtomValue(sidePaneTabIdAtom);

  // Update URL state when workspace/tab/side pane changes
  useEffect(() => {
    writeUrlState({
      workspace: currentWsId ?? null,
      tab: currentTabId ?? null,
      pane2: sidePane ?? null,
    });
  }, [currentWsId, currentTabId, sidePane]);

  useHotkeys();

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
  initPersistence(getStore());
  return (
    <ThemeProvider theme={theme}>
      <Provider store={getStore()}>
        <Inner />
      </Provider>
    </ThemeProvider>
  );
}
