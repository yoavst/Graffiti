// Single source of truth for commands. Both the command palette and the
// hotkey hook consume this list.

import { getStore, type JotaiStore } from '@/state/store';
import { getActiveGraphFromStore, getGraphFull } from '@/state/registry';
import {
  activeGraphIdAtom,
  currentGraphIdAtom,
  sidePaneGraphIdAtom,
  graphsAtom,
} from '@/state/workspaces';
import {
  inspectorVisibleAtom,
  isCurvedEdgesAtom,
  sidebarVisibleAtom,
} from '@/state/settings';
import { appOverlayAtom } from '@/state/appOverlay';
import { nodeSearchScopeAtom } from '@/state/quickOpenPalettes';
import { exportAllGraphsToTar, exportGraphToFile } from '@/persistence/importExport';
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
  getActiveGraphFromStore(getStore())?.actions.undo();
}

export function runGraphRedo(): void {
  getActiveGraphFromStore(getStore())?.actions.redo();
}

export function runExportCurrentGraphJson(store: JotaiStore): void {
  const id = store.get(activeGraphIdAtom);
  if (!id) return;
  getGraphFull(id)?.actions.flush();
  exportGraphToFile(store, id);
}

export async function runCopyCurrentGraphMermaid(store: JotaiStore): Promise<void> {
  const id = store.get(currentGraphIdAtom);
  if (!id) return;
  const graph = store.get(graphsAtom).find((g) => g.id === id);
  const doc = store.get(graphDocAtomFamily(id));
  const s = toMermaid(doc, {
    gui: true,
    elkRenderer: graph?.layout !== 'dagre',
    darkMode: true,
  });
  try {
    await navigator.clipboard.writeText(s);
  } catch {
    await dialogs.alert('Could not copy to clipboard.', { title: 'Clipboard' });
  }
}

export function openGraphJumpPalette(store: JotaiStore): void {
  store.set(appOverlayAtom, 'graphJump');
}

/** Mod+F — search only the graph in the focused pane (primary or side). */
export function openNodeSearchInCurrentGraph(store: JotaiStore): void {
  store.set(nodeSearchScopeAtom, 'currentGraph');
  store.set(appOverlayAtom, 'nodeSearch');
}

/** Mod+Shift+F — search all workspace graphs; choosing a result opens that graph on primary and jumps. */
export function openNodeSearchInAllGraphs(store: JotaiStore): void {
  store.set(nodeSearchScopeAtom, 'allGraphs');
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
      id: 'nav.graphs',
      title: 'Go to graph…',
      hotkey: 'Mod+P',
      section: 'Navigate',
      run: () => openGraphJumpPalette(store),
    },
    {
      id: 'nav.nodes.current',
      title: 'Search nodes in focused graph',
      hint: 'Active pane only',
      hotkey: 'Mod+F',
      section: 'Navigate',
      run: () => openNodeSearchInCurrentGraph(store),
    },
    {
      id: 'nav.nodes.workspace',
      title: 'Search nodes in all graphs',
      hint: 'Opens result on primary',
      hotkey: 'Mod+Shift+F',
      section: 'Navigate',
      run: () => openNodeSearchInAllGraphs(store),
    },
    {
      id: 'export.graph',
      title: 'Export current graph to JSON',
      hotkey: 'Mod+S',
      section: 'File',
      run: () => void runExportCurrentGraphJson(store),
    },
    {
      id: 'export.all',
      title: 'Export all graphs to TAR',
      hotkey: 'Ctrl+Alt+S',
      section: 'File',
      run: () => void exportAllGraphsToTar(store),
    },
    {
      id: 'export.mermaid',
      title: 'Copy current graph as Mermaid',
      section: 'File',
      run: async () => {
        await runCopyCurrentGraphMermaid(store);
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
      title: 'Open current graph in side pane',
      hotkey: 'Ctrl+\\',
      section: 'View',
      run: () => {
        const id = store.get(currentGraphIdAtom);
        if (id) store.set(sidePaneGraphIdAtom, id);
      },
    },
    {
      id: 'view.split.close',
      title: 'Close side pane',
      section: 'View',
      run: () => store.set(sidePaneGraphIdAtom, null),
    },
    {
      id: 'graph.next',
      title: 'Switch to next graph',
      section: 'Navigate',
      run: () => {
        const graphs = store.get(graphsAtom);
        const idx = graphs.findIndex((g) => g.id === store.get(currentGraphIdAtom));
        const next = graphs[(idx + 1) % graphs.length];
        if (next) store.set(currentGraphIdAtom, next.id);
      },
    },
    {
      id: 'help',
      title: 'Show help',
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
