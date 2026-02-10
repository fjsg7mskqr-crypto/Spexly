'use client';

import { NODE_TYPE_CONFIGS } from '@/lib/constants';
import type { SpexlyNodeType } from '@/types/nodes';

interface NodeTypeRowProps {
  type: SpexlyNodeType;
  count: number;
}

export function NodeTypeRow({ type, count }: NodeTypeRowProps) {
  const config = NODE_TYPE_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: config.color }} />
        <span className="text-sm text-slate-300">{config.label}</span>
      </div>
      <span className="text-sm font-medium text-slate-100">{count}</span>
    </div>
  );
}
