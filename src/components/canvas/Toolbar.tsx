'use client';

import { Sparkles, BarChart3 } from 'lucide-react';
import { AddNodeMenu } from './AddNodeMenu';

interface ToolbarProps {
  isDashboardOpen: boolean;
  onToggleDashboard: () => void;
  onOpenWizard: () => void;
}

export function Toolbar({ isDashboardOpen, onToggleDashboard, onOpenWizard }: ToolbarProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-900/80 px-4 py-2 backdrop-blur-sm">
      <span className="text-lg font-bold tracking-tight text-white">Spexly</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWizard}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <Sparkles size={16} />
          New Project
        </button>
        <button
          onClick={onToggleDashboard}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isDashboardOpen
              ? 'border-violet-400/50 bg-violet-400/10 text-violet-300'
              : 'border-white/10 bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <BarChart3 size={16} />
          Dashboard
        </button>
        <AddNodeMenu />
      </div>
    </div>
  );
}
