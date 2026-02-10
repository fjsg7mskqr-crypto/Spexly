'use client';

import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { NODE_TYPE_CONFIGS } from '@/lib/constants';
import type { SpexlyNodeType } from '@/types/nodes';

interface NodeWrapperProps {
  id: string;
  type: SpexlyNodeType;
  expanded: boolean;
  headerLabel?: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

function NodeWrapperInner({
  id,
  type,
  expanded,
  headerLabel,
  subtitle,
  headerExtra,
  children,
}: NodeWrapperProps) {
  const toggleNodeExpanded = useCanvasStore((s) => s.toggleNodeExpanded);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const config = NODE_TYPE_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div
      className="node-appear group relative w-[280px] rounded-xl border border-slate-700/50 bg-slate-800/90 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-150 hover:border-slate-600/80 hover:shadow-xl hover:shadow-black/30"
      style={{ borderLeftWidth: '3px', borderLeftColor: config.color }}
    >
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => toggleNodeExpanded(id)}
      >
        <Icon size={16} className="shrink-0" style={{ color: config.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100 truncate">
              {headerLabel || config.label}
            </span>
            {headerExtra}
          </div>
          {subtitle && (
            <span className="block text-xs text-slate-400 truncate">{subtitle}</span>
          )}
        </div>
        <ChevronRight
          size={14}
          className="shrink-0 text-slate-500 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Expanded body */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: expanded ? '500px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="space-y-3 px-4 pb-4 pt-1">{children}</div>
      </div>

      {/* Delete button — inside card, top-right of header */}
      <button
        className="absolute right-2 top-2.5 hidden group-hover:flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(id);
        }}
      >
        <Trash2 size={13} />
      </button>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const NodeWrapper = memo(NodeWrapperInner);
