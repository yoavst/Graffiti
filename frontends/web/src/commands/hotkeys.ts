import { useHotkeys as useHotkeysHook } from 'react-hotkeys-hook';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  sidePaneTabIdAtom,
  currentTabIdAtom,
  tabsAtom,
  activeTabIdAtom,
  activePaneAtom,
  loadAll,
} from '@/state/workspaces';
import { db } from '@/persistence/db';
import { getCurrentTab } from '@/state/registry';
import { requestFitViewForTab } from '@/flow/flowFitViewBridge';
import { useStore } from 'jotai';
import {
  inspectorVisibleAtom,
  isExistingToNewAtom,
  isNewWillBeSelectedAtom,
} from '@/state/settings';
import { addCommentAction, addTextNodeAction } from './addNodeActions';
import { runGraphRedo, runGraphUndo } from './commands';
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
  const setInspector = useSetAtom(inspectorVisibleAtom);
  const inspector = useAtomValue(inspectorVisibleAtom);
  const tabs = useAtomValue(tabsAtom);
  const store = useStore();

  useHotkeysHook(
    'mod+z',
    (e) => {
      e.preventDefault();
      runGraphUndo();
    },
    [],
  );
  useHotkeysHook(
    'mod+shift+z, mod+y',
    (e) => {
      e.preventDefault();
      runGraphRedo();
    },
    [],
  );
  useHotkeysHook(
    'mod+i',
    (e) => {
      e.preventDefault();
      store.set(isExistingToNewAtom, (v) => !v);
    },
    [store],
  );
  useHotkeysHook(
    'mod+alt+shift+i',
    (e) => {
      e.preventDefault();
      store.set(isNewWillBeSelectedAtom, (v) => !v);
    },
    [store],
  );
  useHotkeysHook(
    'esc',
    (e) => {
      const o = store.get(appOverlayAtom);
      if (o !== 'none') {
        e.preventDefault();
        store.set(appOverlayAtom, 'none');
        return;
      }
      e.preventDefault();
      const t = getCurrentTab();
      t?.actions.select(null);
    },
    [store],
  );
  useHotkeysHook(
    'shift+/',
    (e) => {
      e.preventDefault();
      store.set(appOverlayAtom, 'help');
    },
    [store],
  );
  useHotkeysHook(
    'mod+k',
    (e) => {
      e.preventDefault();
      store.set(appOverlayAtom, 'token');
    },
    [store],
  );
  useHotkeysHook(
    'delete',
    (e) => {
      e.preventDefault();
      const t = getCurrentTab();
      if (!t) return;
      const sel = t.rt.selectedNodeId;
      if (sel == null) return;
      const node = t.rt.doc.nodes.find((n) => n.id === sel);
      if (!node) return;
      const edges = t.rt.doc.edges.filter((e2) => e2.from === sel || e2.to === sel);
      t.actions.applyTransaction([
        ...edges.map((e2) => ({ type: 'removeEdge' as const, data: e2 })),
        { type: 'removeNode' as const, data: node },
      ]);
    },
    [],
  );
  useHotkeysHook(
    'mod+.',
    (e) => {
      e.preventDefault();
      setInspector(!inspector);
    },
    [inspector, setInspector],
  );
  useHotkeysHook(
    'mod+\\',
    (e) => {
      e.preventDefault();
      if (currentTabId) setSide(currentTabId);
    },
    [currentTabId, setSide],
  );
  useHotkeysHook(
    'mod+q',
    (e) => {
      e.preventDefault();
      void addCommentAction(store);
    },
    [store],
  );
  useHotkeysHook(
    'mod+shift+q',
    (e) => {
      e.preventDefault();
      void addTextNodeAction(store);
    },
    [store],
  );
  useHotkeysHook(
    'mod+alt+s',
    (e) => {
      e.preventDefault();
      void exportAllTabsToTar();
    },
    [],
  );
  useHotkeysHook(
    'home',
    (e) => {
      e.preventDefault();
      const id = store.get(activeTabIdAtom);
      if (!id) return;
      requestFitViewForTab(id, store.get(activePaneAtom));
    },
    [store],
  );
  useHotkeysHook(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = themeIndexFromDigitKey(e.key);
      if (idx === null) return;
      const t = getCurrentTab();
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
      void (async () => {
        await db.tabs.update(t.tabId, { pendingNodeTheme: idx });
        const all = await loadAll();
        store.set(tabsAtom, all.tabs);
      })();
    },
    [store],
  );
  void tabs;
}
