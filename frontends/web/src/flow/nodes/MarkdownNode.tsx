import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HANDLE } from '@/flow/nodeHandles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNodeTheme } from '@/graph/model';
import type { GraffitiNodeData } from './CodeNode';

function MarkdownNodeImpl({ data }: NodeProps) {
  const d = data as GraffitiNodeData;
  const node = d.graffiti;
  const theme = getNodeTheme(node);
  const label = node.overrideLabel ?? node.label;
  const borderColor = d.isSelected ? '#fff' : d.isFarHighlighted ? '#dc2626' : theme.stroke ?? 'rgba(0,0,0,0.45)';
  const borderWidth = d.isSelected ? 4 : d.isFarHighlighted ? 3 : 2;
  return (
    <div
      className="rounded-lg border-2 px-3 py-2 text-sm shadow-sm"
      style={{
        background: theme.bg,
        color: theme.fg,
        borderColor,
        borderWidth,
        maxWidth: 520,
      }}
    >
      <Handle type="target" position={Position.Top} id={HANDLE.tgtT} />
      <Handle type="target" position={Position.Right} id={HANDLE.tgtR} />
      <Handle type="target" position={Position.Bottom} id={HANDLE.tgtB} />
      <Handle type="target" position={Position.Left} id={HANDLE.tgtL} />
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{label}</ReactMarkdown>
      <Handle type="source" position={Position.Top} id={HANDLE.srcT} />
      <Handle type="source" position={Position.Right} id={HANDLE.srcR} />
      <Handle type="source" position={Position.Bottom} id={HANDLE.srcB} />
      <Handle type="source" position={Position.Left} id={HANDLE.srcL} />
    </div>
  );
}

export const MarkdownNode = memo(MarkdownNodeImpl);
