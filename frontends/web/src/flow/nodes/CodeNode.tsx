import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HANDLE } from '@/flow/nodeHandles';
import { getNodeTheme, type GNode } from '@/graph/model';

export interface GraffitiNodeData extends Record<string, unknown> {
  graffiti: GNode;
  isSelected: boolean;
  /** Edge target highlight — red border; cleared when a node is selected or Esc. */
  isFarHighlighted?: boolean;
  isLineNode?: boolean;
}

function CodeNodeImpl({ data }: NodeProps) {
  const d = data as GraffitiNodeData;
  const node = d.graffiti;
  const theme = getNodeTheme(node);
  const label = node.overrideLabel ?? node.label;
  const borderColor = d.isSelected ? '#fff' : d.isFarHighlighted ? '#dc2626' : 'rgba(0,0,0,0.45)';
  const borderWidth = d.isSelected ? 4 : d.isFarHighlighted ? 3 : 2;
  return (
    <div
      className="rounded-md border-2 px-3 py-2 text-sm font-medium shadow-sm text-center whitespace-pre-wrap break-words"
      style={{
        background: theme.bg,
        color: theme.fg,
        borderColor,
        borderStyle: d.isLineNode ? 'dashed' : 'solid',
        borderWidth,
        maxWidth: 520,
        wordBreak: 'break-word',
      }}
    >
      <Handle type="target" position={Position.Top} id={HANDLE.tgtT} />
      <Handle type="target" position={Position.Right} id={HANDLE.tgtR} />
      <Handle type="target" position={Position.Bottom} id={HANDLE.tgtB} />
      <Handle type="target" position={Position.Left} id={HANDLE.tgtL} />
      {label}
      <Handle type="source" position={Position.Top} id={HANDLE.srcT} />
      <Handle type="source" position={Position.Right} id={HANDLE.srcR} />
      <Handle type="source" position={Position.Bottom} id={HANDLE.srcB} />
      <Handle type="source" position={Position.Left} id={HANDLE.srcL} />
    </div>
  );
}

export const CodeNode = memo(CodeNodeImpl);
