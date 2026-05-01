// Render exactly one tab per pane.
//
// The React Flow viewport is cached in memory per tab (in GraphCanvas) so
// switching back to a tab restores the exact pan/zoom — but only within
// a session. A page reload starts every tab centered (fitView). The
// layout is also cached per tab so a re-mount with the same node set
// doesn't re-run ELK.

import { useAtomValue, useStore } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { GraphCanvas } from '@/flow/GraphCanvas';
import { tabRuntimeAtom, tabTickAtom, makeTabActions } from '@/state/graph';
import { tabsAtom } from '@/state/workspaces';
import { registerTab, unregisterTab } from '@/state/registry';
import { wsClientAtom } from '@/state/wsClient';
import { jumpToPayload } from '@/network/protocol/legacy';
import type { TabRow } from '@/persistence/db';

export function TabHost({ tabId, onActivate }: { tabId: string; onActivate?: () => void }) {
  const tabs = useAtomValue(tabsAtom);
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
        Tab not found ({tabId.slice(0, 8)}…)
      </div>
    );
  }
  // key={tabId} → fresh React Flow + clean state on every tab switch.
  return <MountedTab key={tabId} tabId={tabId} tab={tab} onActivate={onActivate} />;
}

function MountedTab({ tabId, tab, onActivate }: { tabId: string; tab: TabRow; onActivate?: () => void }) {
  const store = useStore();
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  const tick = useAtomValue(tabTickAtom(tabId));
  void tick;

  const actions = useMemo(
    () =>
      makeTabActions(
        tabId,
        () => store.get(tabRuntimeAtom(tabId)),
        () => store.set(tabTickAtom(tabId), (n) => n + 1),
      ),
    [tabId, store],
  );

  const [hydrated, setHydrated] = useState(rt.loaded);

  // Hydrate on every mount. If already loaded (atomFamily kept the runtime
  // from a previous visit) we just bump the tick + flip the local hydrated
  // flag so the canvas mounts.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await actions.hydrate();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [actions]);

  // Register with the global tab registry for the WS dispatcher.
  useEffect(() => {
    registerTab(tabId, rt, actions);
    return () => unregisterTab(tabId);
  }, [tabId, rt, actions]);

  const ws = useAtomValue(wsClientAtom);

  if (!hydrated) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
        loading {tab.name}…
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      onContextMenu={(e) => e.preventDefault()}
    >
      <GraphCanvas
        tabId={tabId}
        actions={actions}
        rt={rt}
        layoutEngine={tab.layout}
        onActivate={onActivate}
        onJumpToIde={(nodeId) => {
          const node = rt.doc.nodes.find((n) => n.id === nodeId);
          if (!node || !ws) return;
          const payload = jumpToPayload(node);
          if (payload) ws.send(payload);
        }}
      />
    </div>
  );
}
