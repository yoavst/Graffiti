import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNodeTheme } from '@/graph/model';
import type { GraffitiNodeData } from './CodeNode';

function MarkdownNodeImpl({ data }: NodeProps) {
  const d = data as GraffitiNodeData;
  const node = d.graffiti;
  const theme = getNodeTheme(node);
  const label = node.overrideLabel ?? node.label;
  return (
    <div
      className="rounded-lg border-2 px-3 py-2 text-sm shadow-sm"
      style={{
        background: theme.bg,
        color: theme.fg,
        borderColor: d.isSelected ? '#fff' : theme.stroke ?? 'rgba(0,0,0,0.45)',
        borderWidth: d.isSelected ? 4 : 2,
        maxWidth: 520,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{label}</ReactMarkdown>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const MarkdownNode = memo(MarkdownNodeImpl);
