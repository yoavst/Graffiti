import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
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
}

function LabeledEdgeImpl(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  const d = (data ?? {}) as GraffitiEdgeData;
  const curvedDefault = useAtomValue(isCurvedEdgesAtom);

  const pathArgs = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  // Per-edge style takes precedence; otherwise fall back to the global
  // "curved edges" setting (bezier when on, straight when off).
  const curve = d.style?.curve ?? (curvedDefault ? 'smooth' : 'straight');
  const [edgePath, labelX, labelY] =
    curve === 'straight'
      ? getStraightPath(pathArgs)
      : curve === 'step'
        ? getSmoothStepPath(pathArgs)
        : getBezierPath(pathArgs);

  const stroke = d.style?.color ?? 'var(--color-edge)';
  const strokeWidth = d.style?.width ?? (d.isSelected ? 3 : 1.5);
  // Dashed pattern is implied by the 'dotted' arrow type — no separate flag.
  const strokeDasharray = d.arrow === 'dotted' ? '2 5' : undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth, strokeDasharray }}
      />
      {/* Hit area for easier clicking — invisible thicker stroke. */}
      <path
        d={edgePath}
        className="react-flow__edge-path-selector"
        style={{ pointerEvents: 'stroke' }}
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
            className="nodrag nopan"
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const LabeledEdge = memo(LabeledEdgeImpl);
