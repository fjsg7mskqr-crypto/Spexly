'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { NoteNode as NoteNodeType } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 transition-colors';

function NoteNodeComponent({ id, data }: NodeProps<NoteNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const bodyPreview = data.body ? data.body.slice(0, 30) + (data.body.length > 30 ? '…' : '') : '';

  return (
    <NodeWrapper
      id={id}
      type="note"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.title || 'Note'}
      subtitle={bodyPreview || 'Empty note'}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Title</label>
        <input
          className={inputClass}
          placeholder="Title"
          value={data.title}
          onChange={(e) => updateNodeData(id, { title: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Body</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-none`}
          placeholder="Body"
          rows={3}
          value={data.body}
          onChange={(e) => updateNodeData(id, { body: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(NoteNodeComponent);
