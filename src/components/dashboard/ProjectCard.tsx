'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, LayoutGrid, GitFork, Check, X, CheckSquare } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Project } from '@/types/project';
import type { TaskSummary } from '@/app/actions/tasks';

interface ProjectCardProps {
  project: Project;
  taskSummary?: TaskSummary;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, taskSummary, onRename, onDelete }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  const nodeCount = project.canvas_data?.nodes?.length ?? 0;
  const edgeCount = project.canvas_data?.edges?.length ?? 0;
  const updatedAt = new Date(project.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(project.id, trimmed);
    } else {
      setEditName(project.name);
    }
    setIsEditing(false);
  };

  return (
    <div className="group relative rounded-xl border border-white/10 bg-slate-800/50 p-5 transition-colors hover:border-white/20 hover:bg-slate-800/80">
      {/* Project name / edit */}
      {isEditing ? (
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setEditName(project.name); setIsEditing(false); }
            }}
            className="w-full rounded border border-white/20 bg-slate-700 px-2 py-1 text-sm text-white outline-none focus:border-violet-400"
          />
          <button onClick={handleRename} className="text-green-400 hover:text-green-300">
            <Check size={14} />
          </button>
          <button onClick={() => { setEditName(project.name); setIsEditing(false); }} className="text-slate-400 hover:text-slate-200">
            <X size={14} />
          </button>
        </div>
      ) : (
        <Link href={`/project/${project.id}`} className="mb-3 block">
          <h3 className="text-base font-semibold text-white transition-colors group-hover:text-violet-300">
            {project.name}
          </h3>
        </Link>
      )}

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <LayoutGrid size={12} />
          {nodeCount} nodes
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={12} />
          {edgeCount} edges
        </span>
        {taskSummary && taskSummary.total > 0 && (
          <span className="flex items-center gap-1">
            <CheckSquare size={12} />
            {taskSummary.open} open / {taskSummary.total} tasks
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Updated {updatedAt}</span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Rename"
          >
            <Pencil size={14} />
          </button>

          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button
                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-900/50 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
              <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-slate-900 p-6">
                <AlertDialog.Title className="text-lg font-semibold text-white">
                  Delete Project
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-sm text-slate-400">
                  Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be undone.
                </AlertDialog.Description>
                <div className="mt-6 flex justify-end gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={() => onDelete(project.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </div>
    </div>
  );
}
