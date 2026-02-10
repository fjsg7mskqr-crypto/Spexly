'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { ScreenNode as ScreenNodeType } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-colors';

function ScreenNodeComponent({ id, data }: NodeProps<ScreenNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <NodeWrapper
      id={id}
      type="screen"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.screenName || 'Screen'}
      subtitle={data.screenName || 'Page'}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Screen Name</label>
        <input
          className={inputClass}
          placeholder="Screen name"
          value={data.screenName}
          onChange={(e) => updateNodeData(id, { screenName: e.target.value })}
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
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Key Elements</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-none`}
          placeholder="Key elements"
          rows={2}
          value={data.keyElements}
          onChange={(e) => updateNodeData(id, { keyElements: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(ScreenNodeComponent);
