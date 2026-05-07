import { memo, useCallback, useRef } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { isCurvedEdgesAtom } from '@/state/settings';
import type { ArrowKind, EdgeStyle } from '@/graph/model';

export interface GraffitiEdgeData extends Record<string, unknown> {
  arrow?: ArrowKind;
  label?: string;
  style?: EdgeStyle;
  isSelected?: boolean;
  onEdgeMiddleClick?: (event: ReactMouseEvent, farNodeId: number) => void;
}

/** Along the rendered path (source → target), pick the endpoint farther from the click (flow space). */
function farNodeIdFromPathAndClick(
  pathEl: SVGPathElement,
  flowX: number,
  flowY: number,
  sourceId: number,
  targetId: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): number {
  const total = pathEl.getTotalLength();
  if (total < 1e-3) {
    const ds = (sourceX - flowX) ** 2 + (sourceY - flowY) ** 2;
    const dt = (targetX - flowX) ** 2 + (targetY - flowY) ** 2;
    return ds <= dt ? targetId : sourceId;
  }
  const steps = 96;
  let bestS = 0;
  let bestD = Infinity;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * total;
    const p = pathEl.getPointAtLength(s);
    const d = (p.x - flowX) ** 2 + (p.y - flowY) ** 2;
    if (d < bestD) {
      bestD = d;
      bestS = s;
    }
  }
  const ratio = bestS / total;
  return ratio <= 0.5 ? targetId : sourceId;
}

const EDGE_PAN_DRAG_THRESHOLD_PX = 3;

/**
 * React Flow puts `nopan` on every edge group, so the built-in pane drag never
 * starts on strokes. Mirror pane panning by updating the viewport while dragging.
 */
function useEdgeStrokePan() {
  const { getViewport, setViewport } = useReactFlow();
  const panSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    base: { x: number; y: number; zoom: number };
    dragging: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<SVGPathElement>) => {
      if (e.button !== 0) return;
      panSessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        base: getViewport(),
        dragging: false,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [getViewport],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<SVGPathElement>) => {
      const s = panSessionRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (!s.dragging) {
        if (Math.hypot(dx, dy) < EDGE_PAN_DRAG_THRESHOLD_PX) return;
        s.dragging = true;
      }
      suppressClickRef.current = true;
      void setViewport({ x: s.base.x + dx, y: s.base.y + dy, zoom: s.base.zoom });
    },
    [setViewport],
  );

  const endPointer = useCallback((e: ReactPointerEvent<SVGPathElement>) => {
    const s = panSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!s.dragging) {
      suppressClickRef.current = false;
    }
    panSessionRef.current = null;
  }, []);

  const onLostPointerCapture = useCallback((e: ReactPointerEvent<SVGPathElement>) => {
    if (panSessionRef.current?.pointerId === e.pointerId) {
      panSessionRef.current = null;
    }
  }, []);

  const onClickCapture = useCallback((e: ReactMouseEvent<SVGPathElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endPointer,
    onPointerCancel: endPointer,
    onLostPointerCapture,
    onClickCapture,
  };
}

function LabeledEdgeImpl(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data, source, target } =
    props;
  const d = (data ?? {}) as GraffitiEdgeData;
  const curvedDefault = useAtomValue(isCurvedEdgesAtom);
  const { screenToFlowPosition } = useReactFlow();
  const edgeStrokePan = useEdgeStrokePan();
  const pathRef = useRef<SVGPathElement>(null);

  const pathArgs = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const curve = d.style?.curve ?? (curvedDefault ? 'smooth' : 'straight');
  const [edgePath, labelX, labelY] =
    curve === 'straight'
      ? getStraightPath(pathArgs)
      : curve === 'step'
        ? getSmoothStepPath(pathArgs)
        : getBezierPath(pathArgs);

  const stroke = d.style?.color ?? 'var(--color-edge)';
  const strokeWidth = d.style?.width ?? (d.isSelected ? 3 : 1.5);
  const strokeDasharray = d.arrow === 'dotted' ? '2 5' : undefined;

  const onMiddle = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      const cb = d.onEdgeMiddleClick;
      const pathEl = pathRef.current;
      if (!cb || !pathEl) return;
      const { x, y } = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const sourceId = parseInt(source, 10);
      const targetId = parseInt(target, 10);
      const farId = farNodeIdFromPathAndClick(pathEl, x, y, sourceId, targetId, sourceX, sourceY, targetX, targetY);
      cb(e, farId);
    },
    [d.onEdgeMiddleClick, screenToFlowPosition, source, target, sourceX, sourceY, targetX, targetY],
  );

  const stopMiddleScroll = useCallback((e: ReactMouseEvent) => {
    if (e.button === 1) e.preventDefault();
  }, []);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth, strokeDasharray }}
      />
      <path
        ref={pathRef}
        d={edgePath}
        className="react-flow__edge-path-selector"
        style={{ pointerEvents: 'stroke' }}
        onAuxClick={onMiddle}
        onMouseDown={stopMiddleScroll}
        {...edgeStrokePan}
      />
      {d.label !== undefined && d.label !== '' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'var(--color-bg-2)',
              color: 'var(--color-fg)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11,
              pointerEvents: 'all',
            }}
            className="nodrag"
            onAuxClick={onMiddle}
            onMouseDown={stopMiddleScroll}
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const LabeledEdge = memo(LabeledEdgeImpl);
