'use client';

import { create } from 'zustand';
import { getProjectTasks } from '@/app/actions/tasks';
import type { TaskItem, TaskStatus } from '@/app/actions/tasks';

interface TaskState {
  /** All tasks for the current project, keyed by node_id (null key = unlinked) */
  tasksByNode: Map<string, TaskItem[]>;
  projectId: string | null;
  loading: boolean;
  error: string | null;

  /** Fetch all tasks for a project in a single call */
  loadTasks: (projectId: string) => Promise<void>;
  /** Clear the cache (e.g. on project switch) */
  clearTasks: () => void;
  /** Optimistically add a task to the local cache */
  addTask: (task: TaskItem) => void;
  /** Optimistically update a task's status in the local cache */
  updateStatus: (taskId: string, status: TaskStatus) => void;
  /** Optimistically update a task's title in the local cache */
  updateTitle: (taskId: string, title: string) => void;
  /** Get tasks for a specific node */
  getNodeTasks: (nodeId: string) => TaskItem[];
}

function groupByNode(tasks: TaskItem[]): Map<string, TaskItem[]> {
  const map = new Map<string, TaskItem[]>();
  for (const task of tasks) {
    const key = task.node_id ?? '__unlinked__';
    const bucket = map.get(key) ?? [];
    bucket.push(task);
    map.set(key, bucket);
  }
  return map;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasksByNode: new Map(),
  projectId: null,
  loading: false,
  error: null,

  loadTasks: async (projectId: string) => {
    // Skip if already loaded for this project
    if (get().projectId === projectId && get().tasksByNode.size > 0 && !get().error) {
      return;
    }

    set({ loading: true, error: null, projectId });
    try {
      const tasks = await getProjectTasks(projectId);
      set({ tasksByNode: groupByNode(tasks), loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load tasks.',
        loading: false,
      });
    }
  },

  clearTasks: () => {
    set({ tasksByNode: new Map(), projectId: null, loading: false, error: null });
  },

  addTask: (task: TaskItem) => {
    const map = new Map(get().tasksByNode);
    const key = task.node_id ?? '__unlinked__';
    const bucket = map.get(key) ?? [];
    map.set(key, [task, ...bucket]);
    set({ tasksByNode: map });
  },

  updateStatus: (taskId: string, status: TaskStatus) => {
    const map = new Map(get().tasksByNode);
    for (const [key, bucket] of map) {
      const idx = bucket.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        const updated = [...bucket];
        updated[idx] = { ...updated[idx], status };
        map.set(key, updated);
        break;
      }
    }
    set({ tasksByNode: map });
  },

  updateTitle: (taskId: string, title: string) => {
    const map = new Map(get().tasksByNode);
    for (const [key, bucket] of map) {
      const idx = bucket.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        const updated = [...bucket];
        updated[idx] = { ...updated[idx], title };
        map.set(key, updated);
        break;
      }
    }
    set({ tasksByNode: map });
  },

  getNodeTasks: (nodeId: string) => {
    return get().tasksByNode.get(nodeId) ?? [];
  },
}));
