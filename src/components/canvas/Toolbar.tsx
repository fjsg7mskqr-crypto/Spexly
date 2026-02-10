'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BarChart3, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { AddNodeMenu } from './AddNodeMenu';

interface ToolbarProps {
  isDashboardOpen: boolean;
  onToggleDashboard: () => void;
}

function SaveStatus() {
  const isSaving = useCanvasStore((s) => s.isSaving);
  const lastSavedAt = useCanvasStore((s) => s.lastSavedAt);
  const projectId = useCanvasStore((s) => s.projectId);

  if (!projectId) return null;

  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Saving...
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Cloud size={12} />
        Saved
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <CloudOff size={12} />
      Not saved
    </span>
  );
}

export function Toolbar({ isDashboardOpen, onToggleDashboard }: ToolbarProps) {
  const projectName = useCanvasStore((s) => s.projectName);

  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-900/80 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          <Image src="/spexly-logo-white.png" alt="Spexly" width={1349} height={603} className="h-10 w-auto" />
        </Link>
        {projectName && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium text-slate-300">{projectName}</span>
          </>
        )}
        <SaveStatus />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDashboard}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isDashboardOpen
              ? 'border-violet-400/50 bg-violet-400/10 text-violet-300'
              : 'border-white/10 bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <BarChart3 size={16} />
          Stats
        </button>
        <AddNodeMenu />
      </div>
    </div>
  );
}
