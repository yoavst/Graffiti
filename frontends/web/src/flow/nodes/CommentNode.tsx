import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HANDLE } from '@/flow/nodeHandles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNodeTheme } from '@/graph/model';
import type { GraffitiNodeData } from './CodeNode';

function CommentNodeImpl({ data }: NodeProps) {
  const d = data as GraffitiNodeData;
  const node = d.graffiti;
  const theme = getNodeTheme(node);
  const label = node.overrideLabel ?? node.label;
  return (
    <div
      className="px-3 py-2 text-xs italic shadow-sm"
      style={{
        background: theme.bg,
        color: theme.fg,
        border: `2px ${d.isSelected ? 'solid #fff' : `dashed ${theme.stroke ?? '#858585'}`}`,
        borderRadius: 12,
        maxWidth: 320,
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

export const CommentNode = memo(CommentNodeImpl);
