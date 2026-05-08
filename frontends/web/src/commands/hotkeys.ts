import { useHotkeys as useHotkeysHook } from 'react-hotkeys-hook';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  sidePaneGraphIdAtom,
  currentGraphIdAtom,
  activeGraphIdAtom,
  activePaneAtom,
  patchGraphRow,
} from '@/state/workspaces';
import { getGraphFull } from '@/state/registry';
import { requestFitViewForGraph } from '@/flow/flowFitViewBridge';
import { useStore } from 'jotai';
import {
  inspectorVisibleAtom,
  isExistingToNewAtom,
  isNewWillBeSelectedAtom,
} from '@/state/settings';
import { addCommentAction, addTextNodeAction } from './addNodeActions';
import {
  openNodeSearchInAllGraphs,
  openNodeSearchInCurrentGraph,
  runExportCurrentGraphJson,
  runGraphRedo,
  runGraphUndo,
} from './commands';
import { exportAllGraphsToTar } from '@/persistence/importExport';
import { THEMES } from '@/graph/model';
import { appOverlayAtom } from '@/state/appOverlay';

/** 1–9 = first–ninth palette entry (node theme indices 0–8). */
function themeIndexFromDigitKey(key: string): number | null {
  if (key >= '1' && key <= '9') {
    const i = key.charCodeAt(0) - 49;
    return i < THEMES.length ? i : null;
  }
  return null;
}

export function useHotkeys() {
  const setSide = useSetAtom(sidePaneGraphIdAtom);
  const currentGraphId = useAtomValue(currentGraphIdAtom);
  const activeGraphId = useAtomValue(activeGraphIdAtom);
  const activePane = useAtomValue(activePaneAtom);
  const setInspector = useSetAtom(inspectorVisibleAtom);
  const setExistingToNew = useSetAtom(isExistingToNewAtom);
  const setNewWillBeSelected = useSetAtom(isNewWillBeSelectedAtom);
  const [overlay, setOverlay] = useAtom(appOverlayAtom);
  const store = useStore();

  useHotkeysHook(
    'mod+z',
    runGraphUndo,
    { preventDefault: true },
    [],
  );
  useHotkeysHook(
    'mod+shift+z, mod+y',
    runGraphRedo,
    { preventDefault: true },
    [],
  );
  useHotkeysHook(
    'mod+i',
    () => {
      setExistingToNew((v) => !v);
    },
    { preventDefault: true },
    [setExistingToNew],
  );
  useHotkeysHook(
    'mod+alt+shift+i',
    () => {
      setNewWillBeSelected((v) => !v);
    },
    { preventDefault: true },
    [setNewWillBeSelected],
  );
  useHotkeysHook(
    'esc',
    () => {
      if (overlay !== 'none') {
        setOverlay('none');
        return;
      }
      const g = activeGraphId ? getGraphFull(activeGraphId) : null;
      g?.actions.select(null);
    },
    { preventDefault: true },
    [overlay, setOverlay, activeGraphId],
  );
  useHotkeysHook(
    'shift+/',
    () => {
      setOverlay((o) => (o === 'help' ? 'none' : 'help'));
    },
    { preventDefault: true },
    [setOverlay],
  );
  useHotkeysHook(
    'mod+k',
    () => {
      setOverlay((o) => (o === 'token' ? 'none' : 'token'));
    },
    { preventDefault: true },
    [setOverlay],
  );
  useHotkeysHook(
    'mod+p',
    () => {
      setOverlay((o) => (o === 'graphJump' ? 'none' : 'graphJump'));
    },
    { preventDefault: true },
    [setOverlay],
  );


  useHotkeysHook(
    'mod+shift+p',
    () => {
      setOverlay((o) => (o === 'commandPalette' ? 'none' : 'commandPalette'));
    },
    { preventDefault: true },
    [setOverlay],
  );

  useHotkeysHook(
    'mod+f',
    () => {
      openNodeSearchInCurrentGraph(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'mod+shift+f',
    () => {
      openNodeSearchInAllGraphs(store);
    },
    { preventDefault: true },
    [store],
  );

  useHotkeysHook(
    'delete',
    (e) => {
      const g = activeGraphId ? getGraphFull(activeGraphId) : null;
      if (!g) return;
      const sel = g.rt.selectedNodeId;
      if (sel == null) return;
      const node = g.rt.doc.nodes.find((n) => n.id === sel);
      if (!node) return;
      e.preventDefault();
      const edges = g.rt.doc.edges.filter((e2) => e2.from === sel || e2.to === sel);
      g.actions.applyTransaction([
        ...edges.map((e2) => ({ type: 'removeEdge' as const, data: e2 })),
        { type: 'removeNode' as const, data: node },
      ]);
    },
    [activeGraphId],
  );
  useHotkeysHook(
    'mod+.',
    () => {
      setInspector((v) => !v);
    },
    { preventDefault: true },
    [setInspector],
  );
  useHotkeysHook(
    'mod+\\',
    () => {
      if (currentGraphId) setSide(currentGraphId);
    },
    { preventDefault: true },
    [currentGraphId, setSide],
  );
  useHotkeysHook(
    'mod+q',
    () => {
      void addCommentAction(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'mod+shift+q',
    () => {
      void addTextNodeAction(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'mod+s',
    () => {
      void runExportCurrentGraphJson(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'mod+alt+s',
    () => {
      void exportAllGraphsToTar(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'home',
    () => {
      if (!activeGraphId) return;
      requestFitViewForGraph(activeGraphId, activePane);
    },
    { preventDefault: true },
    [activeGraphId, activePane],
  );
  useHotkeysHook(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = themeIndexFromDigitKey(e.key);
      if (idx === null) return;
      const g = activeGraphId ? getGraphFull(activeGraphId) : null;
      if (!g) return;
      const sel = g.rt.selectedNodeId;
      if (sel != null) {
        const node = g.rt.doc.nodes.find((n) => n.id === sel);
        if (!node) return;
        e.preventDefault();
        g.actions.apply({
          type: 'setNodeTheme',
          id: node.id,
          oldTheme: node.theme,
          newTheme: idx,
        });
        return;
      }
      e.preventDefault();
      patchGraphRow(store, g.graphId, { pendingNodeTheme: idx });
    },
    [store, activeGraphId],
  );
}
