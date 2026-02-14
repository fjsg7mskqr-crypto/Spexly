'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BarChart3, CheckSquare, Cloud, CloudOff, FileText, Keyboard, LayoutGrid, Loader2, Redo2, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { AddNodeMenu } from './AddNodeMenu';
import { ExportMenu } from './ExportMenu';

interface ToolbarProps {
  isDashboardOpen: boolean;
  isTaskPanelOpen: boolean;
  onToggleDashboard: () => void;
  onToggleTaskPanel: () => void;
  onOpenImport: () => void;
  onOpenTemplates: () => void;
  onResetLayout: () => void;
  onOpenBatchEnhance: () => void;
  onToggleShortcuts: () => void;
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

function UndoRedoButtons() {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const hasPast = useCanvasStore((s) => s.past.length > 0);
  const hasFuture = useCanvasStore((s) => s.future.length > 0);

  return (
    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-1">
      <button
        onClick={undo}
        disabled={!hasPast}
        title="Undo (Cmd+Z)"
        className="flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={redo}
        disabled={!hasFuture}
        title="Redo (Cmd+Shift+Z)"
        className="flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
}

export function Toolbar({
  isDashboardOpen,
  isTaskPanelOpen,
  onToggleDashboard,
  onToggleTaskPanel,
  onOpenImport,
  onOpenTemplates,
  onResetLayout,
  onOpenBatchEnhance,
  onToggleShortcuts,
}: ToolbarProps) {
  const projectName = useCanvasStore((s) => s.projectName);

  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-900/80 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          <Image src="/spexly-logo-white.png" alt="Spexly" width={1349} height={603} className="h-10 w-auto" priority />
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
        <UndoRedoButtons />
        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <FileText size={16} />
          <span className="hidden lg:inline">Import</span>
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
          <span className="hidden lg:inline">Stats</span>
        </button>
        <button
          onClick={onToggleTaskPanel}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isTaskPanelOpen
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
              : 'border-white/10 bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <CheckSquare size={16} />
          <span className="hidden lg:inline">Tasks</span>
        </button>
        <button
          onClick={onResetLayout}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <RotateCcw size={16} />
          <span className="hidden xl:inline">Reset layout</span>
        </button>
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <LayoutGrid size={16} />
          <span className="hidden xl:inline">Templates</span>
        </button>
        <button
          onClick={onOpenBatchEnhance}
          className="flex items-center gap-2 rounded-lg border border-violet-400/50 bg-violet-400/10 px-3 py-1.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-400/20"
        >
          <Sparkles size={16} />
          <span className="hidden lg:inline">Enhance All</span>
        </button>
        <ExportMenu />
        <AddNodeMenu />
        <button
          onClick={onToggleShortcuts}
          title="Keyboard shortcuts (?)"
          className="flex items-center justify-center rounded-lg border border-white/10 bg-slate-800 p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Keyboard size={16} />
        </button>
      </div>
    </div>
  );
}
