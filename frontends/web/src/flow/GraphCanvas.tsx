import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
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
import { useAtomValue } from 'jotai';
import { CodeNode, type GraffitiNodeData } from './nodes/CodeNode';
import { MarkdownNode } from './nodes/MarkdownNode';
import { CommentNode } from './nodes/CommentNode';
import { LabeledEdge, type GraffitiEdgeData } from './edges/LabeledEdge';
import { tabTickAtom, type TabActions, type TabRuntime } from '@/state/graph';
import { layout, structuralHash } from '@/graph/layout';
import { nodesToInput } from '@/graph/layout/types';
import { darkModeAtom, isCurvedEdgesAtom } from '@/state/settings';
import { registerFlowExportBridge } from '@/flow/flowExportBridge';
import { HANDLE, handlesForEdgeToComment } from '@/flow/nodeHandles';

const nodeTypes = {
  code: CodeNode,
  markdown: MarkdownNode,
  comment: CommentNode,
};
const edgeTypes = { labeled: LabeledEdge };

interface CanvasProps {
  tabId: string;
  actions: TabActions;
  rt: TabRuntime;
  layoutEngine: 'elk' | 'dagre';
  onJumpToIde?: (nodeId: number) => void;
  // Fired whenever the user interacts with this canvas (click on node/edge/
  // pane) so a parent can mark this pane as the "active" one for the
  // inspector. We don't rely on bubbled mousedown alone because React Flow's
  // own listeners can interfere.
  onActivate?: () => void;
}

type LayoutCacheEntry = {
  hash: string;
  positions: Map<number, { x: number; y: number; width: number; height: number }>;
};
const layoutCache = new Map<string, LayoutCacheEntry>();

// In-memory viewport cache. Updated on every onMoveEnd and read on remount,
// so switching back to a tab within the same session restores the exact
// pan/zoom the user left it at. Intentionally not persisted: a fresh page
// load resets to a centered fitView (matching the Controls "fit view"
// button) the first time each tab is opened.
const viewportCache = new Map<string, { x: number; y: number; zoom: number }>();

function CanvasInner({ tabId, actions, rt, layoutEngine, onJumpToIde, onActivate }: CanvasProps) {
  // The doc is mutated in place by the reducer (push/splice), so
  // `rt.doc.nodes` keeps the same reference even when nodes are added or
  // removed. We can't use it as a useEffect dep — instead we drive recompute
  // via the per-tab `tick` atom, which is bumped after every mutation.
  const tick = useAtomValue(tabTickAtom(tabId));
  const curved = useAtomValue(isCurvedEdgesAtom);
  const dark = useAtomValue(darkModeAtom);
  const flow = useReactFlow();
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const rtRef = useRef(rt);
  rtRef.current = rt;
  const flowRootRef = useRef<HTMLDivElement>(null);
  const lastHashRef = useRef<string>(layoutCache.get(tabId)?.hash ?? '');
  // Layout positions live in a state variable so a fresh layout triggers a
  // re-render of the controlled `nodes` prop. Initialize from the cache so
  // remounting a previously-laid-out tab is instant.
  const [positions, setPositions] = useState<Map<number, { x: number; y: number; width: number; height: number }>>(
    () => layoutCache.get(tabId)?.positions ?? new Map(),
  );
  const hasLaidOutRef = useRef(layoutCache.has(tabId));
  const userInteractedRef = useRef(false);
  const wantsAutoFitRef = useRef(false);
  // Viewport state is session-scoped: the in-memory cache survives tab
  // switches but a fresh page load starts empty, so the user gets a
  // centered fitView the first time they open a tab in a session.
  // Captured once via useRef so changing it later doesn't restart the
  // layout effect.
  const startViewport = viewportCache.get(tabId);
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
        layoutCache.set(tabId, { hash, positions: map });
        hasLaidOutRef.current = true;
      })
      .catch((err) => {
        console.error('layout failed for tab', tabId, err);
      });
    return () => {
      cancelled = true;
    };
    // `flow` and `initialViewport` excluded by design — read via refs.
    // `positions` excluded so its own setPositions doesn't re-trigger us.
    // We watch `tick` (bumped after every reducer mutation) instead of the
    // doc arrays directly because the reducer mutates them in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, layoutEngine, curved, tabId]);

  // Auto-fit AFTER the new positions have landed AND React Flow has
  // measured the new node DOM. We rely on useNodesInitialized so the
  // bounding box fitView uses is identical to what the user would get by
  // clicking the Controls "fit view" button manually. fitView is called
  // with no options so the framing matches that button exactly.
  const initialized = useNodesInitialized();
  useEffect(() => {
    if (!wantsAutoFitRef.current) return;
    if (positions.size === 0) return;
    if (!initialized) return;
    wantsAutoFitRef.current = false;
    flowRef.current.fitView();
  }, [positions, initialized]);

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
          isLineNode: n.extra.line !== undefined && !n.extra.isMarkdown,
        },
        draggable: true,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.doc.nodes, rt.selectedNodeId, positions, tick]);

  const edges: Edge<GraffitiEdgeData>[] = useMemo(() => {
    return rt.doc.edges.map((e) => {
      const targetNode = rt.doc.nodes.find((n) => n.id === e.to);
      const targetIsComment = targetNode?.extra.isComment === true;
      const arrow = e.arrow ?? (targetIsComment ? 'none' : 'normal');
      // Marker URLs reference the SVG <defs> we render below the canvas.
      const markerEnd =
        arrow === 'cross'
          ? 'url(#graffiti-arrow-cross)'
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
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.doc.edges, rt.doc.nodes, rt.selectedEdgeId, tick, positions]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, n) => {
      onActivate?.();
      actions.select(parseInt(n.id, 10));
    },
    [actions, onActivate],
  );

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (e, n) => {
      e.preventDefault();
      onActivate?.();
      onJumpToIde?.(parseInt(n.id, 10));
    },
    [onJumpToIde, onActivate],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_e, edge) => {
      onActivate?.();
      actions.selectEdge(parseInt(edge.id, 10));
    },
    [actions, onActivate],
  );

  const onPaneClick = useCallback(() => {
    onActivate?.();
    actions.select(null);
  }, [actions, onActivate]);

  useLayoutEffect(() => {
    const getViewportElement = () =>
      (flowRootRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null) ?? null;

    const prepareFullGraphSnapshot = async () => {
      const f = flowRef.current;
      const prev = f.getViewport();
      if (rtRef.current.doc.nodes.length === 0) {
        return () => {};
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
        return () => {};
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

    registerFlowExportBridge(tabId, { getViewportElement, prepareFullGraphSnapshot });
    return () => registerFlowExportBridge(tabId, null);
  }, [tabId]);

  const onMoveEnd = useCallback(
    (e: unknown, viewport: Viewport) => {
      // If the move was triggered by user interaction (mouse/touch), remember
      // it so we don't auto-fitView again on the next layout.
      if (e) userInteractedRef.current = true;
      viewportCache.set(tabId, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
    },
    [tabId],
  );

  return (
    <div ref={flowRootRef} className="absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
      {/* Custom edge markers — referenced via url(#id) on the edge's
          markerEnd. React Flow injects its built-in markers for the
          ArrowClosed type; we add a "cross" (X) terminator. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="graffiti-arrow-cross"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <line
              x1="1"
              y1="1"
              x2="9"
              y2="9"
              stroke="var(--color-edge)"
              strokeWidth="1.5"
            />
            <line
              x1="9"
              y1="1"
              x2="1"
              y2="9"
              stroke="var(--color-edge)"
              strokeWidth="1.5"
            />
          </marker>
        </defs>
      </svg>
      <Background gap={32} color={dark ? '#3d3d3d' : '#e5e5e5'} />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeStrokeWidth={3}
        maskColor={dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'}
        nodeColor={dark ? '#444' : '#cfd8dc'}
        nodeStrokeColor={dark ? '#888' : '#999'}
        style={{ background: dark ? 'var(--color-bg-2)' : '#fafafa' }}
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
