'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { TechStackNode as TechStackNodeType, TechCategory } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors';

function TechStackNodeComponent({ id, data }: NodeProps<TechStackNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <NodeWrapper
      id={id}
      type="techStack"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.toolName || 'Tech Stack'}
      subtitle={data.category}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Category</label>
        <select
          className={inputClass}
          value={data.category}
          onChange={(e) => updateNodeData(id, { category: e.target.value as TechCategory })}
        >
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Database">Database</option>
          <option value="Auth">Auth</option>
          <option value="Hosting">Hosting</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Tool Name</label>
        <input
          className={inputClass}
          placeholder="Tool name"
          value={data.toolName}
          onChange={(e) => updateNodeData(id, { toolName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Notes</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-none`}
          placeholder="Notes"
          rows={2}
          value={data.notes}
          onChange={(e) => updateNodeData(id, { notes: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(TechStackNodeComponent);
