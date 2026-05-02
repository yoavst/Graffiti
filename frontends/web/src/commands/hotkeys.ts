import { useHotkeys as useHotkeysHook } from 'react-hotkeys-hook';
import { useAtomValue, useSetAtom } from 'jotai';
import { sidePaneTabIdAtom, currentTabIdAtom, tabsAtom } from '@/state/workspaces';
import { getCurrentTab } from '@/state/registry';
import { tabRuntimeAtom, tabTickAtom } from '@/state/graph';
import { useStore } from 'jotai';
import { inspectorVisibleAtom } from '@/state/settings';
import { addCommentAction, addTextNodeAction } from './addNodeActions';

export function useHotkeys(_handlers: { onOpenToken: () => void; onOpenHelp: () => void }) {
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
      const t = getCurrentTab();
      t?.actions.undo();
    },
    [],
  );
  useHotkeysHook(
    'mod+shift+z, mod+y',
    (e) => {
      e.preventDefault();
      const t = getCurrentTab();
      t?.actions.redo();
    },
    [],
  );
  useHotkeysHook(
    'esc',
    (e) => {
      e.preventDefault();
      const t = getCurrentTab();
      t?.actions.select(null);
    },
    [],
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
    'home',
    (e) => {
      e.preventDefault();
      const t = getCurrentTab();
      if (!t) return;
      // Bump the tick to force React Flow to refit if structure changed.
      store.set(tabTickAtom(t.tabId), (n) => n + 1);
      void tabRuntimeAtom; // keep import
    },
    [store],
  );
  void tabs;
}
