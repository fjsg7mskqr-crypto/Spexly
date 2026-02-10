'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { IdeaNode as IdeaNodeType } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-colors';

function IdeaNodeComponent({ id, data }: NodeProps<IdeaNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <NodeWrapper
      id={id}
      type="idea"
      expanded={data.expanded}
      headerLabel={data.appName || 'Idea'}
      subtitle={data.appName ? data.appName : 'Untitled project'}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">App Name</label>
        <input
          className={inputClass}
          placeholder="App name"
          value={data.appName}
          onChange={(e) => updateNodeData(id, { appName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Description</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-none`}
          placeholder="Description"
          rows={2}
          value={data.description}
          onChange={(e) => updateNodeData(id, { description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Target User</label>
        <input
          className={inputClass}
          placeholder="Target user"
          value={data.targetUser}
          onChange={(e) => updateNodeData(id, { targetUser: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Core Problem</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-none`}
          placeholder="Core problem"
          rows={2}
          value={data.coreProblem}
          onChange={(e) => updateNodeData(id, { coreProblem: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(IdeaNodeComponent);
