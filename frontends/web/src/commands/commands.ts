// Single source of truth for commands. Both the command palette and the
// hotkey hook consume this list.

import { getStore, type JotaiStore } from '@/state/store';
import { getActiveTabFromStore } from '@/state/registry';
import {
  activeTabIdAtom,
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  sidePaneTabIdAtom,
  tabsAtom,
} from '@/state/workspaces';
import { getTabFull } from '@/state/registry';
import {
  inspectorVisibleAtom,
  isCurvedEdgesAtom,
  sidebarVisibleAtom,
} from '@/state/settings';
import { appOverlayAtom } from '@/state/appOverlay';
import { nodeSearchScopeAtom } from '@/state/quickOpenPalettes';
import { exportAllTabsToTar, exportTabToFile } from '@/persistence/importExport';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import { toMermaid } from '@/graph/mermaidExport';
import { addCommentAction, addTextNodeAction } from './addNodeActions';
import { dialogs } from '@/ui/dialogs/Dialogs';

export interface Command {
  id: string;
  title: string;
  hint?: string;
  hotkey?: string;
  section?: string;
  run: () => void | Promise<void>;
}

export function runGraphUndo(): void {
  getActiveTabFromStore(getStore())?.actions.undo();
}

export function runGraphRedo(): void {
  getActiveTabFromStore(getStore())?.actions.redo();
}

export function runExportCurrentTabJson(store: JotaiStore): void {
  const id = store.get(activeTabIdAtom);
  if (!id) return;
  getTabFull(id)?.actions.flush();
  exportTabToFile(store, id);
}

export async function runCopyCurrentTabMermaid(store: JotaiStore): Promise<void> {
  const id = store.get(currentTabIdAtom);
  if (!id) return;
  const tab = store.get(tabsAtom).find((t) => t.id === id);
  const doc = store.get(graphDocAtomFamily(id));
  const s = toMermaid(doc, {
    gui: true,
    elkRenderer: tab?.layout !== 'dagre',
    darkMode: true,
  });
  try {
    await navigator.clipboard.writeText(s);
  } catch {
    await dialogs.alert('Could not copy to clipboard.', { title: 'Clipboard' });
  }
}

export function openTabJumpPalette(store: JotaiStore): void {
  store.set(appOverlayAtom, 'tabJump');
}

/** Mod+F — search only the graph in the focused pane (primary or side). */
export function openNodeSearchInCurrentTab(store: JotaiStore): void {
  store.set(nodeSearchScopeAtom, 'currentTab');
  store.set(appOverlayAtom, 'nodeSearch');
}

/** Mod+Shift+F — search all workspace graphs; choosing a result opens that tab on primary and jumps. */
export function openNodeSearchInAllTabs(store: JotaiStore): void {
  store.set(nodeSearchScopeAtom, 'allTabs');
  store.set(appOverlayAtom, 'nodeSearch');
}

export function buildCommands(store: JotaiStore): Command[] {
  const toggle = <T>(atom: import('jotai').PrimitiveAtom<T>, mapper: (v: T) => T) => () => {
    store.set(atom, mapper as never);
  };

  return [
    {
      id: 'graph.addTextNode',
      title: 'Add text node',
      hotkey: 'Ctrl+Shift+Q',
      section: 'Edit',
      run: () => addTextNodeAction(store),
    },
    {
      id: 'graph.addComment',
      title: 'Add comment to selected node',
      hotkey: 'Ctrl+Q',
      section: 'Edit',
      run: () => addCommentAction(store),
    },
    {
      id: 'undo',
      title: 'Undo',
      hotkey: 'Ctrl+Z',
      section: 'Edit',
      run: runGraphUndo,
    },
    {
      id: 'redo',
      title: 'Redo',
      hotkey: 'Ctrl+Y / Ctrl+Shift+Z',
      section: 'Edit',
      run: runGraphRedo,
    },
    {
      id: 'nav.tabs',
      title: 'Go to tab…',
      hotkey: 'Mod+P',
      section: 'Navigate',
      run: () => openTabJumpPalette(store),
    },
    {
      id: 'nav.nodes.current',
      title: 'Search nodes in focused graph',
      hint: 'Active pane only',
      hotkey: 'Mod+F',
      section: 'Navigate',
      run: () => openNodeSearchInCurrentTab(store),
    },
    {
      id: 'nav.nodes.workspace',
      title: 'Search nodes in all tabs',
      hint: 'Opens result on primary',
      hotkey: 'Mod+Shift+F',
      section: 'Navigate',
      run: () => openNodeSearchInAllTabs(store),
    },
    {
      id: 'export.tab',
      title: 'Export current tab to JSON',
      hotkey: 'Mod+S',
      section: 'File',
      run: () => void runExportCurrentTabJson(store),
    },
    {
      id: 'export.all',
      title: 'Export all tabs to TAR',
      hotkey: 'Ctrl+Alt+S',
      section: 'File',
      run: () => void exportAllTabsToTar(store),
    },
    {
      id: 'export.mermaid',
      title: 'Copy current tab as Mermaid',
      section: 'File',
      run: async () => {
        await runCopyCurrentTabMermaid(store);
      },
    },
    {
      id: 'export.share',
      title: 'Share graph…',
      section: 'File',
      run: () => {
        store.set(appOverlayAtom, 'shareGraph');
      },
    },
    {
      id: 'view.sidebar',
      title: 'Toggle sidebar',
      section: 'View',
      run: toggle(sidebarVisibleAtom, (v) => !v),
    },
    {
      id: 'view.inspector',
      title: 'Toggle inspector panel',
      hotkey: 'Ctrl+.',
      section: 'View',
      run: toggle(inspectorVisibleAtom, (v) => !v),
    },
    {
      id: 'view.curved',
      title: 'Toggle curved edges',
      section: 'View',
      run: toggle(isCurvedEdgesAtom, (v) => !v),
    },
    {
      id: 'view.split.right',
      title: 'Open current tab in side pane',
      hotkey: 'Ctrl+\\',
      section: 'View',
      run: () => {
        const id = store.get(currentTabIdAtom);
        if (id) store.set(sidePaneTabIdAtom, id);
      },
    },
    {
      id: 'view.split.close',
      title: 'Close side pane',
      section: 'View',
      run: () => store.set(sidePaneTabIdAtom, null),
    },
    {
      id: 'tab.next',
      title: 'Switch to next tab',
      section: 'Tabs',
      run: () => {
        const tabs = store.get(tabsAtom);
        const wid = store.get(currentWorkspaceIdAtom);
        const filtered = tabs.filter((t) => {
          // Only those in the current workspace.
          void t;
          return true;
        });
        void wid;
        const idx = filtered.findIndex((t) => t.id === store.get(currentTabIdAtom));
        const next = filtered[(idx + 1) % filtered.length];
        if (next) store.set(currentTabIdAtom, next.id);
      },
    },
    {
      id: 'help',
      title: 'Show help',
      hotkey: '?',
      section: 'Help',
      run: () => {
        store.set(appOverlayAtom, 'help');
      },
    },
    {
      id: 'token',
      title: 'Manage auth token',
      hotkey: 'Ctrl+K',
      section: 'Help',
      run: () => {
        store.set(appOverlayAtom, 'token');
      },
    },
  ];
}
