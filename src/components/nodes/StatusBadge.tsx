'use client';

import { Check, AlertTriangle, Lock, Loader, Circle } from 'lucide-react';
import type { FeatureStatus } from '@/types/nodes';
import { FEATURE_STATUS_CONFIG } from '@/lib/constants';

const iconMap = {
  circle: Circle,
  loader: Loader,
  check: Check,
  'alert-triangle': AlertTriangle,
  lock: Lock,
} as const;

interface StatusBadgeProps {
  status: FeatureStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = FEATURE_STATUS_CONFIG[status];
  const IconComponent = iconMap[config.icon];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        config.pulse ? 'status-pulse ring-1 ring-blue-500/30' : ''
      }`}
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <IconComponent size={9} />
      {status}
    </span>
  );
}
