'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { SpexlyNodeType, FeatureStatus, FeatureNodeData } from '@/types/nodes';
import { ProgressBar } from './ProgressBar';
import { NodeTypeRow } from './NodeTypeRow';
import { StatusRow } from './StatusRow';

interface ProgressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_TYPES: SpexlyNodeType[] = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note'];
const ALL_STATUSES: FeatureStatus[] = ['Planned', 'In Progress', 'Built', 'Broken', 'Blocked'];

export function ProgressDashboard({ isOpen, onClose }: ProgressDashboardProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const summary = useMemo(() => {
    const byType = {} as Record<SpexlyNodeType, number>;
    for (const node of nodes) {
      const t = node.type as SpexlyNodeType;
      byType[t] = (byType[t] || 0) + 1;
    }
    return { totalNodes: nodes.length, byType, totalEdges: edges.length };
  }, [nodes, edges]);

  const statusCounts = useMemo(() => {
    const counts: Record<FeatureStatus, number> = {
      Planned: 0, 'In Progress': 0, Built: 0, Broken: 0, Blocked: 0,
    };
    for (const node of nodes) {
      if (node.type === 'feature') {
        const status = (node.data as FeatureNodeData).status;
        counts[status] = (counts[status] || 0) + 1;
      }
    }
    return counts;
  }, [nodes]);

  const completedCount = useMemo(() => {
    return nodes.filter((n) => n.data.completed).length;
  }, [nodes]);

  const overallPercent = summary.totalNodes > 0 ? Math.round((completedCount / summary.totalNodes) * 100) : 0;

  const { totalFeatures, builtCount } = useMemo(() => {
    const features = nodes.filter((n) => n.type === 'feature');
    return {
      totalFeatures: features.length,
      builtCount: features.filter((n) => n.data.completed).length,
    };
  }, [nodes]);
  const completionPercent = totalFeatures > 0 ? Math.round((builtCount / totalFeatures) * 100) : 0;

  return (
    <div
      className={`fixed right-0 top-0 z-30 h-screen w-80 border-l border-white/10 bg-slate-900 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto p-5">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Project Progress</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-800/50 p-3">
            <span className="text-2xl font-bold text-white">{summary.totalNodes}</span>
            <span className="block text-xs text-slate-400">Nodes</span>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <span className="text-2xl font-bold text-white">{summary.totalEdges}</span>
            <span className="block text-xs text-slate-400">Edges</span>
          </div>
        </div>

        {/* Overall Completion */}
        {summary.totalNodes > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Overall Progress
            </h3>
            <ProgressBar
              percent={overallPercent}
              color="#34D399"
              label={`${overallPercent}% Complete (${completedCount}/${summary.totalNodes} nodes done)`}
            />
          </div>
        )}

        {/* Feature Completion */}
        {totalFeatures > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Features Built
            </h3>
            <ProgressBar
              percent={completionPercent}
              color="#60A5FA"
              label={`${completionPercent}% Complete (${builtCount}/${totalFeatures} features built)`}
            />
          </div>
        )}

        {/* Node Types */}
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Nodes by Type
          </h3>
          {ALL_TYPES.map((type) => (
            <NodeTypeRow key={type} type={type} count={summary.byType[type] || 0} />
          ))}
        </div>

        {/* Feature Status */}
        {totalFeatures > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Feature Status
            </h3>
            {ALL_STATUSES.map((status) => (
              <StatusRow key={status} status={status} count={statusCounts[status]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
