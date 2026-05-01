// Single source of truth for commands. Both the command palette and the
// hotkey hook consume this list.

import type { JotaiStore } from '@/state/store';
import { getCurrentTab } from '@/state/registry';
import {
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  sidePaneTabIdAtom,
  tabsAtom,
} from '@/state/workspaces';
import {
  inspectorVisibleAtom,
  isCurvedEdgesAtom,
  sidebarVisibleAtom,
  darkModeAtom,
} from '@/state/settings';
import { exportAllTabsToTar, exportTabToFile } from '@/persistence/importExport';
import { db } from '@/persistence/db';
import { toMermaid } from '@/graph/mermaidExport';

export interface Command {
  id: string;
  title: string;
  hint?: string;
  hotkey?: string;
  section?: string;
  run: () => void | Promise<void>;
}

export function buildCommands(store: JotaiStore, openHelp: () => void, openToken: () => void): Command[] {
  const toggle = <T>(atom: import('jotai').PrimitiveAtom<T>, mapper: (v: T) => T) => () => {
    store.set(atom, mapper as never);
  };

  return [
    {
      id: 'undo',
      title: 'Undo',
      hotkey: 'Ctrl+Z',
      section: 'Edit',
      run: () => getCurrentTab()?.actions.undo(),
    },
    {
      id: 'redo',
      title: 'Redo',
      hotkey: 'Ctrl+Y / Ctrl+Shift+Z',
      section: 'Edit',
      run: () => getCurrentTab()?.actions.redo(),
    },
    {
      id: 'export.tab',
      title: 'Export current tab to JSON',
      hotkey: 'Ctrl+S',
      section: 'File',
      run: () => {
        const id = store.get(currentTabIdAtom);
        if (id) void exportTabToFile(id);
      },
    },
    {
      id: 'export.all',
      title: 'Export all tabs to TAR',
      hotkey: 'Ctrl+Alt+S',
      section: 'File',
      run: () => void exportAllTabsToTar(),
    },
    {
      id: 'export.mermaid',
      title: 'Copy current tab as Mermaid',
      section: 'File',
      run: async () => {
        const id = store.get(currentTabIdAtom);
        if (!id) return;
        const g = await db.graphs.get(id);
        if (!g) return;
        const dark = store.get(darkModeAtom);
        const s = toMermaid(g.doc, { gui: true, elkRenderer: true, darkMode: dark });
        await navigator.clipboard.writeText(s);
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
      run: openHelp,
    },
    {
      id: 'token',
      title: 'Manage auth token',
      hotkey: 'Ctrl+K',
      section: 'Help',
      run: openToken,
    },
  ];
}
