import { useHotkeys as useHotkeysHook } from 'react-hotkeys-hook';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  sidePaneTabIdAtom,
  currentTabIdAtom,
  activeTabIdAtom,
  activePaneAtom,
  patchTabRow,
} from '@/state/workspaces';
import { getTabFull } from '@/state/registry';
import { requestFitViewForTab } from '@/flow/flowFitViewBridge';
import { useStore } from 'jotai';
import {
  inspectorVisibleAtom,
  isExistingToNewAtom,
  isNewWillBeSelectedAtom,
} from '@/state/settings';
import { addCommentAction, addTextNodeAction } from './addNodeActions';
import { runExportCurrentTabJson, runGraphRedo, runGraphUndo } from './commands';
import { exportAllTabsToTar } from '@/persistence/importExport';
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
  const setSide = useSetAtom(sidePaneTabIdAtom);
  const currentTabId = useAtomValue(currentTabIdAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
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
      const t = activeTabId ? getTabFull(activeTabId) : null;
      t?.actions.select(null);
    },
    { preventDefault: true },
    [overlay, setOverlay, activeTabId],
  );
  useHotkeysHook(
    'shift+/',
    () => {
      setOverlay('help');
    },
    { preventDefault: true },
    [setOverlay],
  );
  useHotkeysHook(
    'mod+k',
    () => {
      setOverlay('token');
    },
    { preventDefault: true },
    [setOverlay],
  );
  useHotkeysHook(
    'delete',
    (e) => {
      const t = activeTabId ? getTabFull(activeTabId) : null;
      if (!t) return;
      const sel = t.rt.selectedNodeId;
      if (sel == null) return;
      const node = t.rt.doc.nodes.find((n) => n.id === sel);
      if (!node) return;
      e.preventDefault();
      const edges = t.rt.doc.edges.filter((e2) => e2.from === sel || e2.to === sel);
      t.actions.applyTransaction([
        ...edges.map((e2) => ({ type: 'removeEdge' as const, data: e2 })),
        { type: 'removeNode' as const, data: node },
      ]);
    },
    [activeTabId],
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
      if (currentTabId) setSide(currentTabId);
    },
    { preventDefault: true },
    [currentTabId, setSide],
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
      void runExportCurrentTabJson(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'mod+alt+s',
    () => {
      void exportAllTabsToTar(store);
    },
    { preventDefault: true },
    [store],
  );
  useHotkeysHook(
    'home',
    () => {
      if (!activeTabId) return;
      requestFitViewForTab(activeTabId, activePane);
    },
    { preventDefault: true },
    [activeTabId, activePane],
  );
  useHotkeysHook(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = themeIndexFromDigitKey(e.key);
      if (idx === null) return;
      const t = activeTabId ? getTabFull(activeTabId) : null;
      if (!t) return;
      const sel = t.rt.selectedNodeId;
      if (sel != null) {
        const node = t.rt.doc.nodes.find((n) => n.id === sel);
        if (!node) return;
        e.preventDefault();
        t.actions.apply({
          type: 'setNodeTheme',
          id: node.id,
          oldTheme: node.theme,
          newTheme: idx,
        });
        return;
      }
      e.preventDefault();
      patchTabRow(store, t.tabId, { pendingNodeTheme: idx });
    },
    [store, activeTabId],
  );
}
