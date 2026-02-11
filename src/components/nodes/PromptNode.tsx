'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { PromptNode as PromptNodeType, TargetTool } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30 transition-colors';

function PromptNodeComponent({ id, data }: NodeProps<PromptNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <NodeWrapper
      id={id}
      type="prompt"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.targetTool ? `Prompt → ${data.targetTool}` : 'Prompt'}
      subtitle={data.targetTool}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Prompt</label>
        <textarea
          className={`${inputClass} min-h-[110px] resize-y`}
          placeholder="Prompt text"
          rows={3}
          value={data.promptText}
          onChange={(e) => updateNodeData(id, { promptText: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Target Tool</label>
        <select
          className={inputClass}
          value={data.targetTool}
          onChange={(e) => updateNodeData(id, { targetTool: e.target.value as TargetTool })}
        >
          <option value="Claude">Claude</option>
          <option value="Bolt">Bolt</option>
          <option value="Cursor">Cursor</option>
          <option value="Lovable">Lovable</option>
          <option value="Replit">Replit</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Result Notes</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Result notes"
          rows={2}
          value={data.resultNotes}
          onChange={(e) => updateNodeData(id, { resultNotes: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(PromptNodeComponent);
