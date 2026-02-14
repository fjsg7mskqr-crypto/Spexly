'use client';

import { memo, type ReactNode, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, Trash2, Check, PanelLeftOpen } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { NODE_TYPE_CONFIGS } from '@/lib/constants';
import { showUndo } from '@/store/toastStore';
import type { SpexlyNodeType } from '@/types/nodes';

interface NodeWrapperProps {
  id: string;
  type: SpexlyNodeType;
  expanded: boolean;
  completed: boolean;
  headerLabel?: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

function NodeWrapperInner({
  id,
  type,
  expanded,
  completed,
  headerLabel,
  subtitle,
  headerExtra,
  children,
}: NodeWrapperProps) {
  const toggleNodeExpanded = useCanvasStore((s) => s.toggleNodeExpanded);
  const toggleNodeCompleted = useCanvasStore((s) => s.toggleNodeCompleted);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const setNodeHeight = useCanvasStore((s) => s.setNodeHeight);
  const setSidebarNodeId = useCanvasStore((s) => s.setSidebarNodeId);
  const config = NODE_TYPE_CONFIGS[type];
  const Icon = config.icon;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const height = el.getBoundingClientRect().height;
      setNodeHeight(id, height);
    };
    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, setNodeHeight, expanded, completed, children]);

  return (
    <div
      ref={wrapperRef}
      className={`node-appear group relative w-[320px] min-h-[58px] rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
        completed
          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-800/90 to-emerald-500/5 shadow-emerald-900/10'
          : 'border-slate-700/50 bg-slate-800/90 shadow-black/20 hover:border-slate-600/80 hover:shadow-black/30'
      } ${expanded ? 'ring-2 ring-sky-400/50 node-glow' : ''}`}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: completed ? '#34D399' : config.color,
        minWidth: '320px',
      }}
    >
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => toggleNodeExpanded(id)}
      >
        {/* Completion checkbox — outer button provides a larger hit area */}
        <button
          className="shrink-0 flex items-center justify-center p-1 -m-1"
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCompleted(id);
          }}
        >
          <span
            className={`flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 transition-all duration-200 ${
              completed
                ? 'border-emerald-400 bg-emerald-500 scale-110'
                : 'border-slate-500 hover:border-slate-300'
            }`}
          >
            {completed && <Check size={11} className="text-white" strokeWidth={3} />}
          </span>
        </button>

        <Icon
          size={16}
          className="shrink-0 transition-colors duration-200"
          style={{ color: completed ? '#34D399' : config.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium truncate transition-all duration-200 ${
                completed ? 'text-slate-400 line-through' : 'text-slate-100'
              }`}
            >
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
          maxHeight: expanded ? '720px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div
          className={`nowheel space-y-3 px-4 pb-4 pt-1 transition-opacity duration-200 ${completed ? 'opacity-50' : ''} overflow-y-auto custom-scrollbar`}
          style={{ maxHeight: '650px' }}
        >
          {children}
        </div>
      </div>

      {/* Action buttons — inside card, top-right of header */}
      <div className="absolute right-7 top-1 hidden group-hover:flex items-center gap-0.5">
        <button
          className="flex items-center justify-center p-2 rounded text-slate-500 hover:text-sky-400 hover:bg-slate-700/50 transition-colors"
          title="Open in sidebar"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarNodeId(id);
          }}
        >
          <PanelLeftOpen size={16} />
        </button>
        <button
          className="flex items-center justify-center p-2 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
            showUndo(`Deleted ${headerLabel || config.label}`, () => {
              useCanvasStore.getState().undo();
            });
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const NodeWrapper = memo(NodeWrapperInner);
