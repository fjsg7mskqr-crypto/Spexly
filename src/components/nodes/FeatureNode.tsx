'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { StatusBadge } from './StatusBadge';
import { useCanvasStore } from '@/store/canvasStore';
import type { FeatureNode as FeatureNodeType, FeaturePriority, FeatureStatus } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-colors';

function FeatureNodeComponent({ id, data }: NodeProps<FeatureNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const subtitle = `${data.priority} Have · ${data.status}`;

  return (
    <NodeWrapper
      id={id}
      type="feature"
      expanded={data.expanded}
      headerLabel={data.featureName || 'Feature'}
      subtitle={subtitle}
      headerExtra={<StatusBadge status={data.status} />}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Feature Name</label>
        <input
          className={inputClass}
          placeholder="Feature name"
          value={data.featureName}
          onChange={(e) => updateNodeData(id, { featureName: e.target.value })}
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
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Priority</label>
        <select
          className={inputClass}
          value={data.priority}
          onChange={(e) => updateNodeData(id, { priority: e.target.value as FeaturePriority })}
        >
          <option value="Must">Must Have</option>
          <option value="Should">Should Have</option>
          <option value="Nice">Nice to Have</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Status</label>
        <select
          className={inputClass}
          value={data.status}
          onChange={(e) => updateNodeData(id, { status: e.target.value as FeatureStatus })}
        >
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Built">Built</option>
          <option value="Broken">Broken</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>
    </NodeWrapper>
  );
}

export default memo(FeatureNodeComponent);
