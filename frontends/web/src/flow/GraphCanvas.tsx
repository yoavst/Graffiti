import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type Viewport,
} from '@xyflow/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { CodeNode, type GraffitiNodeData } from './nodes/CodeNode';
import { MarkdownNode } from './nodes/MarkdownNode';
import { CommentNode } from './nodes/CommentNode';
import { LabeledEdge, type GraffitiEdgeData } from './edges/LabeledEdge';
import { graphTickAtom, type GraphActions, type GraphRuntime } from '@/state/graph';
import { layout, structuralHash } from '@/graph/layout';
import { nodesToInput } from '@/graph/layout/types';
import { isCurvedEdgesAtom } from '@/state/settings';
import { registerFlowExportBridge } from '@/flow/flowExportBridge';
import {
  pendingNodeFocusAtom,
  type FlowPane,
} from '@/state/pendingNodeFocus';
import { registerFlowFitView } from '@/flow/flowFitViewBridge';
import { HANDLE, handlesForEdgeToComment } from '@/flow/nodeHandles';
import { PenColorSwatch } from '@/ui/PenColorSwatch';

const nodeTypes = {
  code: CodeNode,
  markdown: MarkdownNode,
  comment: CommentNode,
};
const edgeTypes = { labeled: LabeledEdge };

interface CanvasProps {
  graphId: string;
  /** Which split pane hosts this canvas — required so duplicate graphs can receive the right focus. */
  pane: FlowPane;
  actions: GraphActions;
  rt: GraphRuntime;
  layoutEngine: 'elk' | 'dagre';
  onJumpToIde?: (nodeId: number) => void;
}

type LayoutCacheEntry = {
  hash: string;
  positions: Map<number, { x: number; y: number; width: number; height: number }>;
};
const layoutCache = new Map<string, LayoutCacheEntry>();

// In-memory viewport cache. Updated on every onMoveEnd and read on remount,
// so switching back to a graph within the same session restores the exact
// pan/zoom the user left it at. Intentionally not persisted: a fresh page
// load resets to a centered fitView (matching the Controls "fit view"
// button) the first time each graph is opened.
const viewportCache = new Map<string, { x: number; y: number; zoom: number }>();

function CanvasInner({ graphId, pane, actions, rt, layoutEngine, onJumpToIde }: CanvasProps) {
  // The doc is mutated in place by the reducer (push/splice), so
  // `rt.doc.nodes` keeps the same reference even when nodes are added or
  // removed. We can't use it as a useEffect dep — instead we drive recompute
  // via the per-graph `tick` atom, which is bumped after every mutation.
  const tick = useAtomValue(graphTickAtom(graphId));
  const globalPendingFocus = useAtomValue(pendingNodeFocusAtom);
  const setPendingNodeFocus = useSetAtom(pendingNodeFocusAtom);
  const curved = useAtomValue(isCurvedEdgesAtom);
  const flow = useReactFlow();
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const rtRef = useRef(rt);
  rtRef.current = rt;
  const flowRootRef = useRef<HTMLDivElement>(null);
  const lastHashRef = useRef<string>(layoutCache.get(graphId)?.hash ?? '');
  // Layout positions live in a state variable so a fresh layout triggers a
  // re-render of the controlled `nodes` prop. Initialize from the cache so
  // remounting a previously-laid-out graph is instant.
  const [positions, setPositions] = useState<Map<number, { x: number; y: number; width: number; height: number }>>(
    () => layoutCache.get(graphId)?.positions ?? new Map(),
  );
  const hasLaidOutRef = useRef(layoutCache.has(graphId));
  const userInteractedRef = useRef(false);
  const wantsAutoFitRef = useRef(false);
  // Viewport state is session-scoped: the in-memory cache survives graph
  // switches but a fresh page load starts empty, so the user gets a
  // centered fitView the first time they open a graph in a session.
  // Captured once via useRef so changing it later doesn't restart the
  // layout effect.
  const startViewport = viewportCache.get(graphId);
  const startViewportRef = useRef(startViewport);
  const hadInitialViewportRef = useRef(!!startViewport);

  // Compute and cache layout when the graph structure changes.
  useEffect(() => {
    const hash = structuralHash(rt.doc.nodes, rt.doc.edges);
    // IMPORTANT: only short-circuit when we already have positions for this
    // hash. We used to early-return whenever the hash matched lastHashRef,
    // but under React strict mode the cleanup of the first effect would
    // cancel the in-flight layout while leaving lastHashRef poisoned — the
    // second effect run then bailed and layout never completed.
    if (hash === lastHashRef.current && positions.size > 0) return;
    if (rt.doc.nodes.length === 0) return;

    const wasFirstLayout = !hasLaidOutRef.current;
    let cancelled = false;
    // Compute the same input ELK/dagre saw, so we can reuse widths/heights
    // for the rendered React Flow nodes (and the minimap).
    const inputs = nodesToInput(rt.doc.nodes);
    const sizeMap = new Map(inputs.map((i) => [i.id, { width: i.width, height: i.height }]));
    void layout(rt.doc.nodes, rt.doc.edges, {
      engine: layoutEngine,
      curved,
    })
      .then((res) => {
        if (cancelled) return;
        const map = new Map<number, { x: number; y: number; width: number; height: number }>();
        for (const p of res.positions) {
          const sz = sizeMap.get(p.id) ?? { width: 200, height: 50 };
          map.set(p.id, { x: p.x, y: p.y, ...sz });
        }
        // Only mark layout "done" after positions actually land.
        lastHashRef.current = hash;
        // Mark "we want a fit on the next render where positions land".
        // The auto-fit effect below picks this up after React Flow has
        // received the un-hidden nodes via the controlled `nodes` prop;
        // calling fitView here would race the render and see hidden nodes.
        if (wasFirstLayout && !hadInitialViewportRef.current && !userInteractedRef.current) {
          wantsAutoFitRef.current = true;
        }
        setPositions(map);
        layoutCache.set(graphId, { hash, positions: map });
        hasLaidOutRef.current = true;
      })
      .catch((err) => {
        console.error('layout failed for graph', graphId, err);
      });
    return () => {
      cancelled = true;
    };
    // `flow` read via refs. `positions` omitted so setPositions doesn't re-trigger.
    // `tick` replaces `rt.doc.*` deps: the doc arrays keep stable references under in-place mutation.
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentional; adding positions.size / rt.doc causes loops or redundant runs
  }, [tick, layoutEngine, curved, graphId]);

  // Auto-fit AFTER the new positions have landed AND React Flow has
  // measured the new node DOM. We rely on useNodesInitialized so the
  // bounding box fitView uses is identical to what the user would get by
  // clicking the Controls "fit view" button manually. fitView is called
  // with no options so the framing matches that button exactly.
  const initialized = useNodesInitialized();

  // Numeric `padding` uses React Flow's relative formula for every branch so
  // search/jump (`forceNodeId`) matches Home / Controls single-node fit.
  const singleNodeFitPadding = 1;

  /** Toolbar fit / Home: full graph or `fitView` on the selected node. With `forceNodeId`, skip `getNode` (it can lag `actions.select` in the same tick). */
  const smartFitView = useCallback((forceNodeId?: number) => {
    const f = flowRef.current;
    const docRt = rtRef.current;
    const sel = forceNodeId ?? docRt.selectedNodeId;
    if (sel != null && docRt.doc.nodes.some((n) => n.id === sel)) {
      if (forceNodeId != null) {
        void f.fitView({
          nodes: [{ id: String(sel) }],
          padding: singleNodeFitPadding,
          duration: 400,
        });
        return;
      }
      const rfNode = f.getNode(String(sel));
      if (rfNode && !rfNode.hidden) {
        void f.fitView({
          nodes: [{ id: String(sel) }],
          padding: singleNodeFitPadding,
          duration: 400,
        });
        return;
      }
    }
    void f.fitView();
  }, []);

  useLayoutEffect(() => {
    registerFlowFitView(graphId, pane, () => smartFitView());
    return () => registerFlowFitView(graphId, pane, null);
  }, [graphId, pane, smartFitView]);

  useEffect(() => {
    if (!wantsAutoFitRef.current) return;
    if (positions.size === 0) return;
    if (!initialized) return;
    wantsAutoFitRef.current = false;
    flowRef.current.fitView();
  }, [positions, initialized]);

  const pendingForThisPane = useMemo(() => {
    if (!globalPendingFocus || globalPendingFocus.graphId !== graphId || globalPendingFocus.pane !== pane) {
      return null;
    }
    return globalPendingFocus;
  }, [globalPendingFocus, graphId, pane]);

  const pendingNodeLayoutReady =
    pendingForThisPane != null && positions.has(pendingForThisPane.nodeId) && initialized;

  // Subscribes via `pendingNodeFocusAtom` — no `tick` dep; `fitView` stays imperative one frame after select.
  useEffect(() => {
    if (!pendingForThisPane || !pendingNodeLayoutReady) return;
    const { nodeId, token } = pendingForThisPane;
    actions.select(nodeId);
    requestAnimationFrame(() => {
      void Promise.resolve(smartFitView(nodeId)).finally(() => {
        setPendingNodeFocus((c) => (c?.token === token ? null : c));
      });
    });
  }, [pendingForThisPane, pendingNodeLayoutReady, actions, smartFitView, setPendingNodeFocus]);

  // Build React Flow node/edge arrays. Nodes that don't have a layout
  // position yet (newly added since the last layout) are hidden so they
  // don't flash at (0, 0). They become visible as soon as the next layout
  // pass completes and `positions` gets repopulated.
  const nodes: Node<GraffitiNodeData>[] = useMemo(() => {
    return rt.doc.nodes.map((n) => {
      const flavor =
        n.extra.isComment ? 'comment'
          : n.extra.isMarkdown ? 'markdown'
            : 'code';
      const cached = positions.get(n.id);
      const pos = cached ? { x: cached.x, y: cached.y } : { x: 0, y: 0 };
      const node: Node<GraffitiNodeData> = {
        id: String(n.id),
        type: flavor,
        position: pos,
        data: {
          graffiti: n,
          isSelected: rt.selectedNodeId === n.id,
          isFarHighlighted: rt.farHighlightNodeId === n.id,
          isLineNode: n.extra.line !== undefined && !n.extra.isMarkdown,
        },
        draggable: false,
        hidden: !cached,
      };
      if (cached) {
        node.width = cached.width;
        node.height = cached.height;
        (node as unknown as { measured?: { width: number; height: number } }).measured = {
          width: cached.width,
          height: cached.height,
        };
        node.style = { width: cached.width, minHeight: cached.height };
      }
      return node;
    });
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- `tick` re-runs when the doc mutates in place; `rt.doc.nodes` keeps the same reference
  }, [rt.doc.nodes, rt.selectedNodeId, rt.farHighlightNodeId, positions, tick]);

  const onEdgeMiddleClick = useCallback(
    (e: ReactMouseEvent, farNodeId: number) => {
      if (e.ctrlKey) {
        actions.select(farNodeId);
        requestAnimationFrame(() => {
          void smartFitView(farNodeId);
        });
        return;
      }
      actions.setFarHighlight(farNodeId);
      requestAnimationFrame(() => {
        void smartFitView(farNodeId);
      });
    },
    [actions, smartFitView],
  );

  const edges: Edge<GraffitiEdgeData>[] = useMemo(() => {
    return rt.doc.edges.map((e) => {
      const targetNode = rt.doc.nodes.find((n) => n.id === e.to);
      const targetIsComment = targetNode?.extra.isComment === true;
      const arrow = e.arrow ?? (targetIsComment ? 'none' : 'normal');
      // Marker URLs reference the SVG <defs> we render below the canvas.
      // String markers must be bare ids — EdgeWrapper wraps as url(`#${id}`).
      const markerEnd =
        arrow === 'cross'
          ? 'graffiti-arrow-cross'
          : arrow === 'none'
            ? undefined
            : { type: MarkerType.ArrowClosed, color: e.style?.color ?? 'var(--color-edge)' };
      const side =
        targetIsComment ? handlesForEdgeToComment(e.from, e.to, positions) : undefined;
      return {
        id: String(e.id),
        source: String(e.from),
        target: String(e.to),
        type: 'labeled',
        sourceHandle: side?.sourceHandle ?? HANDLE.srcB,
        targetHandle: side?.targetHandle ?? HANDLE.tgtT,
        markerEnd,
        data: {
          arrow,
          label: e.label,
          style: e.style,
          isSelected: rt.selectedEdgeId === e.id,
          onEdgeMiddleClick,
        },
      };
    });
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- `tick` re-runs when the doc mutates in place; edge/node arrays keep stable references
  }, [rt.doc.edges, rt.doc.nodes, rt.selectedEdgeId, tick, positions, onEdgeMiddleClick]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (e, n) => {
      const id = parseInt(n.id, 10);
      if ((e.ctrlKey || e.metaKey) && onJumpToIde) {
        e.preventDefault();
        onJumpToIde(id);
        actions.select(id);
        return;
      }
      actions.select(id);
    },
    [actions, onJumpToIde],
  );

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (e, n) => {
      e.preventDefault();
      onJumpToIde?.(parseInt(n.id, 10));
    },
    [onJumpToIde],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_e, edge) => {
      actions.selectEdge(parseInt(edge.id, 10));
    },
    [actions],
  );

  const onPaneClick = useCallback(() => {}, []);

  useLayoutEffect(() => {
    const getViewportElement = () =>
      (flowRootRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null) ?? null;

    const prepareFullGraphSnapshot = async () => {
      const f = flowRef.current;
      const prev = f.getViewport();
      if (rtRef.current.doc.nodes.length === 0) {
        return () => { };
      }
      const pane = flowRootRef.current?.querySelector('.react-flow') as HTMLElement | null;
      const cw = Math.max(1, pane?.clientWidth ?? 800);
      const ch = Math.max(1, pane?.clientHeight ?? 600);
      const nodes = f.getNodes();
      const bounds = f.getNodesBounds(nodes);
      if (
        !Number.isFinite(bounds.width) ||
        !Number.isFinite(bounds.height) ||
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        return () => { };
      }
      // Align graph bbox to top-left (small pad) so html-to-image SVG/JPEG
      // content starts at the origin instead of centered with empty margins.
      // Screen = flow * zoom + viewport.{x,y} (@xyflow/system rendererPointToPoint).
      const pad = 12;
      const zoom = Math.max(0.05, Math.min(4, Math.min((cw - 2 * pad) / bounds.width, (ch - 2 * pad) / bounds.height)));
      f.setViewport({
        x: pad - bounds.x * zoom,
        y: pad - bounds.y * zoom,
        zoom,
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      return () => {
        f.setViewport(prev);
      };
    };

    registerFlowExportBridge(graphId, { getViewportElement, prepareFullGraphSnapshot });
    return () => registerFlowExportBridge(graphId, null);
  }, [graphId]);

  const onMoveEnd = useCallback(
    (e: unknown, viewport: Viewport) => {
      // If the move was triggered by user interaction (mouse/touch), remember
      // it so we don't auto-fitView again on the next layout.
      if (e) userInteractedRef.current = true;
      viewportCache.set(graphId, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
    },
    [graphId],
  );

  return (
    <div ref={flowRootRef} className="absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        defaultViewport={startViewportRef.current ?? { x: 0, y: 0, zoom: 1 }}
        fitView={!startViewportRef.current}
        minZoom={0.05}
        maxZoom={4}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="graffiti-arrow-cross"
              viewBox="-0.75 -0.75 13.5 13.5"
              refX="11"
              refY="6"
              markerWidth="12"
              markerHeight="12"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <line
                x1="2"
                y1="2"
                x2="10"
                y2="10"
                stroke="#c0c0c0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="2"
                x2="2"
                y2="10"
                stroke="#c0c0c0"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </marker>
          </defs>
        </svg>
        <Background gap={32} color="#3d3d3d" />
        <Panel
          position="bottom-left"
          className="!m-0"
          style={{
            bottom: 'calc(15px + 78px + 8px)',
            left: 15,
            zIndex: 6,
          }}
        >
          <PenColorSwatch graphId={graphId} />
        </Panel>
        <Controls showInteractive={false} onFitView={smartFitView}></Controls>
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={3}
          maskColor="rgba(0,0,0,0.55)"
          nodeColor="#444"
          nodeStrokeColor="#888"
          style={{ background: 'var(--color-bg-2)' }}
        />
      </ReactFlow>
    </div>
  );
}

export function GraphCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
