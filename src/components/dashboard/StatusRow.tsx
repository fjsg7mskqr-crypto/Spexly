'use client';

import { FEATURE_STATUS_CONFIG } from '@/lib/constants';
import type { FeatureStatus } from '@/types/nodes';

interface StatusRowProps {
  status: FeatureStatus;
  count: number;
}

export function StatusRow({ status, count }: StatusRowProps) {
  const config = FEATURE_STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-sm text-slate-300">{status}</span>
      </div>
      <span className="text-sm font-medium text-slate-100">{count}</span>
    </div>
  );
}
