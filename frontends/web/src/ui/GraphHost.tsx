// Render exactly one graph per pane.
//
// The React Flow viewport is cached in memory per graph (in GraphCanvas) so
// switching back to a graph restores the exact pan/zoom — but only within
// a session. A page reload starts every graph centered (fitView). The
// layout is also cached per graph so a re-mount with the same node set
// doesn't re-run ELK.

import { useAtomValue, useStore } from 'jotai';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { GraphCanvas } from '@/flow/GraphCanvas';
import { useSubscribeGraphDocMutations } from '@/hooks/useSubscribeGraphDocMutations';
import { graphRuntimeAtom, graphTickAtom, makeGraphActions } from '@/state/graph';
import { graphsAtom } from '@/state/workspaces';
import { registerGraph, unregisterGraph } from '@/state/registry';
import { wsClientAtom } from '@/state/wsClient';
import { jumpToPayload } from '@/network/protocol/legacy';
import type { GraphRow } from '@/state/workspaceTypes';
import type { FlowPane } from '@/state/pendingNodeFocus';

export function GraphHost({
  graphId,
  pane,
}: {
  graphId: string;
  pane: FlowPane;
}) {
  const graphs = useAtomValue(graphsAtom);
  const graph = graphs.find((g) => g.id === graphId);
  if (!graph) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
        Graph not found ({graphId.slice(0, 8)}…)
      </div>
    );
  }
  // key={graphId} → fresh React Flow + clean state on every graph switch.
  return (
    <MountedGraph
      key={graphId}
      graphId={graphId}
      graph={graph}
      pane={pane}
    />
  );
}

function MountedGraph({
  graphId,
  graph,
  pane,
}: {
  graphId: string;
  graph: GraphRow;
  pane: FlowPane;
}) {
  const store = useStore();
  const rt = useAtomValue(graphRuntimeAtom(graphId));
  useSubscribeGraphDocMutations(graphId);

  const actions = useMemo(
    () =>
      makeGraphActions(
        graphId,
        store,
        () => store.get(graphRuntimeAtom(graphId)),
        () => store.set(graphTickAtom(graphId), (n) => n + 1),
      ),
    [graphId, store],
  );

  useLayoutEffect(() => {
    actions.hydrate();
  }, [actions]);

  // Register with the global graph registry for the WS dispatcher.
  useEffect(() => {
    registerGraph(graphId, rt, actions);
    return () => unregisterGraph(graphId);
  }, [graphId, rt, actions]);

  useEffect(() => {
    return () => {
      if (store.get(graphRuntimeAtom(graphId)).loaded) actions.flush();
    };
  }, [actions, graphId, store]);

  const ws = useAtomValue(wsClientAtom);

  if (!rt.loaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
        loading {graph.name}…
      </div>
    );
  }

  return (
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}>
      <GraphCanvas
        graphId={graphId}
        pane={pane}
        actions={actions}
        rt={rt}
        layoutEngine={graph.layout}
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

