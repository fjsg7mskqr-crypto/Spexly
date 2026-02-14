'use client';

import { useMemo, useState } from 'react';
import { CheckSquare, Loader2, Pencil, Plus, Save, X } from 'lucide-react';
import {
  createTask,
  updateTaskContent,
  updateTaskStatus,
  type LinkableNodeType,
  type TaskStatus,
} from '@/app/actions/tasks';
import { useCanvasStore } from '@/store/canvasStore';
import { useTaskStore } from '@/store/taskStore';

interface TaskSubnodesProps {
  nodeId: string;
  nodeType: LinkableNodeType;
  enabled: boolean;
  variant?: 'full' | 'compact';
  hideWhenNoActive?: boolean;
}

export function TaskSubnodes({
  nodeId,
  nodeType,
  enabled,
  variant = 'full',
  hideWhenNoActive = false,
}: TaskSubnodesProps) {
  const projectId = useCanvasStore((s) => s.projectId);
  const tasksByNode = useTaskStore((s) => s.tasksByNode);
  const tasks = useMemo(() => tasksByNode.get(nodeId) ?? [], [tasksByNode, nodeId]);
  const loading = useTaskStore((s) => s.loading);
  const addTaskToStore = useTaskStore((s) => s.addTask);
  const updateStatusInStore = useTaskStore((s) => s.updateStatus);
  const updateTitleInStore = useTaskStore((s) => s.updateTitle);

  const [draftTitle, setDraftTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const active = total - done;
    return { total, done, active };
  }, [tasks]);

  const handleToggleDone = async (task: { id: string; status: TaskStatus }) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    setUpdatingId(task.id);
    setError(null);
    try {
      await updateTaskStatus(task.id, nextStatus);
      updateStatusInStore(task.id, nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreate = async () => {
    const title = draftTitle.trim();
    if (!title || !projectId) return;

    setAdding(true);
    setError(null);
    try {
      const created = await createTask({
        projectId,
        nodeId,
        nodeType,
        title,
        source: 'manual',
        sourceAgent: 'canvas-subnode',
        metadata: { source: 'subnode' },
      });
      addTaskToStore(created);
      setDraftTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (task: { id: string; title: string }) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = async (taskId: string) => {
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setError('Task title is required.');
      return;
    }

    setSavingId(taskId);
    setError(null);
    try {
      await updateTaskContent(taskId, { title: nextTitle });
      updateTitleInStore(taskId, nextTitle);
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSavingId(null);
    }
  };

  if (!enabled) return null;

  const compactTasks = tasks.slice(0, 3);
  const isCompact = variant === 'compact';
  if (isCompact && hideWhenNoActive && loading) return null;
  if (hideWhenNoActive && !loading && stats.active === 0) return null;

  return (
    <div className={`rounded-lg border border-white/10 p-2.5 ${isCompact ? 'bg-slate-950/70' : 'bg-slate-900/40'}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <CheckSquare size={12} className="text-amber-300" />
          Subtasks
        </div>
        <span className="text-[11px] text-slate-500">
          {stats.done}/{stats.total}
        </span>
      </div>

      {loading && (
        <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 size={11} className="animate-spin" />
          Loading
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="mb-2 max-h-40 space-y-1 overflow-y-auto pr-1">
          {(isCompact ? compactTasks : tasks).map((task) => (
            <div key={task.id} className="rounded px-1 py-1 hover:bg-white/5">
              <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-600 bg-slate-900 text-amber-400"
                checked={task.status === 'done'}
                disabled={updatingId === task.id}
                onChange={() => void handleToggleDone(task)}
              />
                {editingId === task.id && !isCompact ? (
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={savingId === task.id}
                        onClick={() => void saveEdit(task.id)}
                        className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300 disabled:opacity-40"
                      >
                        <Save size={10} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                      >
                        <X size={10} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      className={`min-w-0 flex-1 text-[11px] leading-4 ${
                        task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'
                      }`}
                    >
                      {task.title}
                    </span>
                    {!isCompact && (
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="flex items-center justify-center rounded p-0.5 text-slate-500 hover:text-amber-300"
                        title="Edit subtask"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {isCompact && tasks.length > compactTasks.length && (
            <div className="px-1 text-[11px] text-slate-500">
              +{tasks.length - compactTasks.length} more
            </div>
          )}
        </div>
      )}

      {!isCompact && (
        <div className="flex items-center gap-1.5">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleCreate();
              }
            }}
            placeholder="Add subtask"
            className="nodrag h-8 w-full rounded border border-slate-600/40 bg-slate-900 px-2 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={adding || !draftTitle.trim()}
            className="nodrag flex h-8 w-8 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
            title="Add subtask"
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          </button>
        </div>
      )}

      {error && <div className="mt-2 text-[11px] text-rose-300">{error}</div>}
    </div>
  );
}
