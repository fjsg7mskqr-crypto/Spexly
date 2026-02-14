'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Loader2, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import {
  deleteTask,
  getProjectTasks,
  linkTaskToNode,
  saveTaskAutofillMetadata,
  updateTaskContent,
  updateTaskStatus,
  type TaskItem,
  type TaskStatus,
} from '@/app/actions/tasks';
import { useCanvasStore } from '@/store/canvasStore';
import { buildNodeAutofillUpdate } from '@/lib/tasks/autofill';
import { updateCanvasData } from '@/app/actions/projects';
import type { SpexlyNodeType } from '@/types/nodes';

interface TaskPanelProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AutofillMetadata {
  nodeId?: string;
  nodeType?: string;
  appliedAt?: string;
  previousValues?: Record<string, unknown>;
  appliedValues?: Record<string, unknown>;
  arrayAdditions?: Record<string, string[]>;
  appendedChunks?: Record<string, string>;
}

function formatAppliedAt(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

function statusPillClass(status: TaskStatus): string {
  switch (status) {
    case 'done':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'in_progress':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
    case 'blocked':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    default:
      return 'border-slate-600/40 bg-slate-800/60 text-slate-300';
  }
}

function inferNodeType(task: TaskItem): SpexlyNodeType {
  const allowed: SpexlyNodeType[] = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note'];
  if (task.node_type && allowed.includes(task.node_type as SpexlyNodeType)) {
    return task.node_type as SpexlyNodeType;
  }
  return 'feature';
}

function taskToNodeData(task: TaskItem, nodeType: SpexlyNodeType): Record<string, unknown> {
  const title = task.title.trim();
  const details = task.details?.trim() || '';

  switch (nodeType) {
    case 'idea':
      return { appName: title, description: details };
    case 'feature':
      return { featureName: title, summary: details };
    case 'screen':
      return { screenName: title, purpose: details };
    case 'techStack':
      return { toolName: title, notes: details };
    case 'prompt':
      return { promptText: `${title}\n\n${details}`.trim() };
    case 'note':
      return { title, body: details };
    default:
      return { featureName: title, summary: details };
  }
}

export function TaskPanel({ projectId, isOpen, onClose }: TaskPanelProps) {
  const setSidebarNodeId = useCanvasStore((s) => s.setSidebarNodeId);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const addNode = useCanvasStore((s) => s.addNode);
  const nodes = useCanvasStore((s) => s.nodes);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [autofillCache, setAutofillCache] = useState<Record<string, AutofillMetadata>>({});

  const summary = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const open = total - done;
    return { total, done, open };
  }, [tasks]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectTasks(projectId);
      setTasks(data);
      setAutofillCache({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const persistCanvasNow = useCallback(async () => {
    const state = useCanvasStore.getState();
    if (!state.projectId) return;
    state.setSaveStatus(true);
    try {
      await updateCanvasData(state.projectId, state.nodes, state.edges);
    } finally {
      state.setSaveStatus(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    void loadTasks();
  }, [isOpen, projectId, loadTasks]);

  const handleToggleDone = async (task: TaskItem) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    setUpdatingTaskId(task.id);
    setError(null);
    try {
      await updateTaskStatus(task.id, nextStatus);
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setUpdatingTaskId(taskId);
    setError(null);
    try {
      await updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, status } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleApplyToNode = async (task: TaskItem) => {
    if (!task.node_id) return;
    const node = nodes.find((n) => n.id === task.node_id);
    if (!node) {
      setError('Linked node no longer exists on this canvas.');
      return;
    }

    const updates = buildNodeAutofillUpdate(node, {
      title: task.title,
      details: task.details,
    });

    if (Object.keys(updates).length === 0) {
      setError('No applicable fields to autofill for this node.');
      return;
    }

    const previousValues: Record<string, unknown> = {};
    const appliedValues: Record<string, unknown> = {};
    const arrayAdditions: Record<string, string[]> = {};
    const appendedChunks: Record<string, string> = {};

    for (const [field, appliedValue] of Object.entries(updates)) {
      const previousValue = (node.data as Record<string, unknown>)[field];
      previousValues[field] = previousValue;
      appliedValues[field] = appliedValue;

      if (Array.isArray(previousValue) && Array.isArray(appliedValue)) {
        const prevStrings = previousValue.filter((v): v is string => typeof v === 'string');
        const appliedStrings = appliedValue.filter((v): v is string => typeof v === 'string');
        const additions = appliedStrings.filter((item) => !prevStrings.includes(item));
        if (additions.length > 0) {
          arrayAdditions[field] = additions;
        }
      }

      if (typeof previousValue === 'string' && typeof appliedValue === 'string' && appliedValue.startsWith(previousValue)) {
        const chunk = appliedValue.slice(previousValue.length);
        if (chunk.trim()) {
          appendedChunks[field] = chunk;
        }
      }
    }

    updateNodeData(node.id, updates);

    const autofillPayload: AutofillMetadata = {
      nodeId: node.id,
      nodeType: node.type,
      appliedAt: new Date().toISOString(),
      previousValues,
      appliedValues,
      arrayAdditions,
      appendedChunks,
    };

    try {
      await saveTaskAutofillMetadata(task.id, {
        ...autofillPayload,
      });
    } catch {
      // Keep node updates even if metadata save fails.
    }
    setAutofillCache((prev) => ({ ...prev, [task.id]: autofillPayload }));
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              metadata: {
                ...(item.metadata || {}),
                autofill: autofillPayload,
              },
            }
          : item
      )
    );
    setError(null);

    await persistCanvasNow();

    // Mark task as in progress after applying context to the node.
    if (task.status === 'todo') {
      try {
        await updateTaskStatus(task.id, 'in_progress');
        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, status: 'in_progress' } : item))
        );
      } catch {
        // Keep node updates even if task status update fails.
      }
    }
  };

  const handleDeleteTask = async (task: TaskItem) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setDeletingTaskId(task.id);
    setError(null);
    try {
      const metadata =
        task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
          ? (task.metadata as Record<string, unknown>)
          : {};
      const autofill = autofillCache[task.id] ?? (metadata.autofill as AutofillMetadata | undefined);

      if (task.node_id && autofill && autofill.previousValues && autofill.appliedValues) {
        const node = nodes.find((n) => n.id === task.node_id);
        if (node) {
          const rollback: Record<string, unknown> = {};

          for (const [field, previousValue] of Object.entries(autofill.previousValues)) {
            const currentValue = (node.data as Record<string, unknown>)[field];
            const appliedValue = autofill.appliedValues?.[field];

            if (Array.isArray(currentValue) && Array.isArray(appliedValue)) {
              const additions = autofill.arrayAdditions?.[field] ?? [];
              if (additions.length > 0) {
                const filtered = currentValue.filter(
                  (item) => !(typeof item === 'string' && additions.includes(item))
                );
                if (JSON.stringify(filtered) !== JSON.stringify(currentValue)) {
                  rollback[field] = filtered;
                }
              } else if (JSON.stringify(currentValue) === JSON.stringify(appliedValue)) {
                rollback[field] = previousValue;
              }
              continue;
            }

            if (JSON.stringify(currentValue) === JSON.stringify(appliedValue)) {
              rollback[field] = previousValue;
              continue;
            }

            if (typeof currentValue === 'string' && typeof appliedValue === 'string') {
              const chunk = autofill.appendedChunks?.[field];
              if (chunk && currentValue.endsWith(chunk)) {
                rollback[field] = currentValue.slice(0, currentValue.length - chunk.length);
              }
            }
          }

          if (Object.keys(rollback).length > 0) {
            updateNodeData(node.id, rollback);
            await persistCanvasNow();
          }
        }
      }

      await deleteTask(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setAutofillCache((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleCreateNode = async (task: TaskItem) => {
    const nodeType = inferNodeType(task);
    const seedPosition = nodes.length
      ? {
          x: nodes[nodes.length - 1].position.x + 360,
          y: nodes[nodes.length - 1].position.y + 60,
        }
      : { x: 0, y: 0 };

    const newNodeId = addNode(nodeType, seedPosition);
    updateNodeData(newNodeId, taskToNodeData(task, nodeType));

    try {
      await linkTaskToNode(task.id, newNodeId, nodeType);
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, node_id: newNodeId, node_type: nodeType, link_confidence: 1 }
            : item
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link task to created node.');
    }

    await persistCanvasNow();
    onClose();
    setSidebarNodeId(newNodeId);
  };

  const handleStartEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDetails(task.details || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDetails('');
  };

  const handleSaveEdit = async (taskId: string) => {
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setError('Task title is required.');
      return;
    }

    setSavingTaskId(taskId);
    setError(null);
    try {
      await updateTaskContent(taskId, {
        title: nextTitle,
        details: editDetails.trim() || null,
      });
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? { ...item, title: nextTitle, details: editDetails.trim() || null }
            : item
        )
      );
      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSavingTaskId(null);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 z-30 h-screen w-96 border-r border-white/10 bg-slate-900 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold text-slate-100">Project Tasks</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => void loadTasks()}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              aria-label="Refresh tasks"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              aria-label="Close tasks panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-300">
          <div>{summary.open} open</div>
          <div>{summary.done} done</div>
          <div>{summary.total} total</div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Loading tasks...
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-slate-800/40 p-3 text-sm text-slate-400">
            No tasks yet. Tasks posted by AI agents to `/api/agent/ingest` will appear here.
          </div>
        )}

        <div className="space-y-2">
          {tasks.map((task) => {
            const isUpdating = updatingTaskId === task.id;
            const isEditing = editingTaskId === task.id;
            const metadata =
              task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
                ? (task.metadata as Record<string, unknown>)
                : {};
            const savedAutofill = metadata.autofill as AutofillMetadata | undefined;
            const autofill = autofillCache[task.id] ?? savedAutofill;
            const appliedAt = formatAppliedAt(autofill?.appliedAt);
            return (
              <div key={task.id} className="rounded-lg border border-white/10 bg-slate-800/50 p-3">
                <div className="mb-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => void handleToggleDone(task)}
                    disabled={isUpdating}
                    className="mt-1 rounded border-slate-600 bg-slate-900 text-amber-400"
                  />
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                        />
                        <textarea
                          value={editDetails}
                          onChange={(e) => setEditDetails(e.target.value)}
                          rows={3}
                          className="w-full resize-y rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                          placeholder="Task details (optional)"
                        />
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(task.id)}
                            disabled={savingTaskId === task.id}
                            className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
                          >
                            <Save size={11} />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded border border-white/10 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`text-sm ${
                            task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.details && (
                          <div className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{task.details}</div>
                        )}
                      </>
                    )}
                    {appliedAt && (
                      <div className="mt-2 inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                        Applied to node: {appliedAt}
                      </div>
                    )}
                    {task.node_id && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-sky-300">
                          linked: {task.node_type || 'node'}
                        </span>
                        <button
                          type="button"
                          className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
                          onClick={() => {
                            const exists = nodes.some((node) => node.id === task.node_id);
                            if (exists) {
                              onClose();
                              setSidebarNodeId(task.node_id);
                            } else {
                              setError('Linked node no longer exists on this canvas.');
                            }
                          }}
                        >
                          Open node
                        </button>
                        <button
                          type="button"
                          className="text-amber-300 hover:text-amber-200 underline underline-offset-2"
                          onClick={() => void handleApplyToNode(task)}
                        >
                          Apply to node
                        </button>
                        {typeof task.link_confidence === 'number' && (
                          <span className="text-slate-500">
                            {Math.round(task.link_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    {!task.node_id && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded border border-slate-600/40 bg-slate-800/70 px-2 py-0.5 text-slate-300">
                          unlinked
                        </span>
                        <button
                          type="button"
                          className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                          onClick={() => void handleCreateNode(task)}
                        >
                          Create node
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[11px] ${statusPillClass(task.status)}`}>
                    {task.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <select
                      value={task.status}
                      disabled={isUpdating}
                      onChange={(e) => void handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isUpdating || deletingTaskId === task.id}
                      onClick={() => handleStartEdit(task)}
                      className="flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-amber-300 hover:bg-slate-700/50 transition-colors disabled:opacity-40"
                      title="Edit task"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating || deletingTaskId === task.id}
                      onClick={() => void handleDeleteTask(task)}
                      className="flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors disabled:opacity-40"
                      title="Delete task"
                    >
                      {deletingTaskId === task.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
