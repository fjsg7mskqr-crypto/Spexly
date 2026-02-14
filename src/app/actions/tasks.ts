'use server';

import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  DatabaseError,
  ValidationError,
  logError,
} from '@/lib/errors';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface TaskItem {
  id: string;
  user_id: string;
  project_id: string;
  node_id: string | null;
  node_type: string | null;
  link_confidence: number | null;
  title: string;
  details: string | null;
  status: TaskStatus;
  source: string;
  source_agent: string;
  external_ref: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskSummary {
  total: number;
  open: number;
  done: number;
}

function isMissingTaskTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return (
    code === '42P01' || // Postgres undefined_table
    code === 'PGRST205' || // PostgREST table not found
    message.toLowerCase().includes('task_items')
  );
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError();
  return user.id;
}

export async function getProjectTaskSummaries(projectIds: string[]): Promise<Record<string, TaskSummary>> {
  try {
    if (projectIds.length === 0) {
      return {};
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_items')
      .select('project_id,status')
      .eq('user_id', userId)
      .in('project_id', projectIds);

    if (error) {
      if (isMissingTaskTableError(error)) {
        return {};
      }
      logError(error, { action: 'getProjectTaskSummaries', userId });
      throw new DatabaseError('Failed to fetch task summaries.');
    }

    const summaryMap: Record<string, TaskSummary> = {};

    for (const projectId of projectIds) {
      summaryMap[projectId] = { total: 0, open: 0, done: 0 };
    }

    for (const row of data ?? []) {
      const projectId = String(row.project_id);
      if (!summaryMap[projectId]) {
        summaryMap[projectId] = { total: 0, open: 0, done: 0 };
      }

      summaryMap[projectId].total += 1;
      if (row.status === 'done') {
        summaryMap[projectId].done += 1;
      } else {
        summaryMap[projectId].open += 1;
      }
    }

    return summaryMap;
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'getProjectTaskSummaries' });
    throw new DatabaseError('Failed to fetch task summaries.');
  }
}

export async function getProjectTasks(projectId: string): Promise<TaskItem[]> {
  try {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required.');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_items')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTaskTableError(error)) {
        return [];
      }
      logError(error, { action: 'getProjectTasks', userId, projectId });
      throw new DatabaseError('Failed to fetch project tasks.');
    }

    return (data ?? []) as TaskItem[];
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'getProjectTasks', projectId });
    throw new DatabaseError('Failed to fetch project tasks.');
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    if (!taskId?.trim()) {
      throw new ValidationError('Task ID is required.');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('task_items')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      if (isMissingTaskTableError(error)) {
        throw new ValidationError('Task system is not initialized yet. Run latest database migrations.');
      }
      logError(error, { action: 'deleteTask', userId, taskId });
      throw new DatabaseError('Failed to delete task.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'deleteTask', taskId });
    throw new DatabaseError('Failed to delete task.');
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  try {
    if (!taskId?.trim()) {
      throw new ValidationError('Task ID is required.');
    }

    if (!['todo', 'in_progress', 'done', 'blocked'].includes(status)) {
      throw new ValidationError('Invalid task status.');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('task_items')
      .update({ status })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      if (isMissingTaskTableError(error)) {
        throw new ValidationError('Task system is not initialized yet. Run latest database migrations.');
      }
      logError(error, { action: 'updateTaskStatus', userId, taskId });
      throw new DatabaseError('Failed to update task status.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'updateTaskStatus', taskId });
    throw new DatabaseError('Failed to update task status.');
  }
}

export async function saveTaskAutofillMetadata(
  taskId: string,
  autofill: Record<string, unknown>
): Promise<void> {
  try {
    if (!taskId?.trim()) {
      throw new ValidationError('Task ID is required.');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('task_items')
      .select('metadata')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      logError(fetchError, { action: 'saveTaskAutofillMetadata:fetch', userId, taskId });
      throw new DatabaseError('Failed to load task metadata.');
    }

    const baseMetadata =
      existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    const { error } = await supabase
      .from('task_items')
      .update({ metadata: { ...baseMetadata, autofill } })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      logError(error, { action: 'saveTaskAutofillMetadata:update', userId, taskId });
      throw new DatabaseError('Failed to save task metadata.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'saveTaskAutofillMetadata', taskId });
    throw new DatabaseError('Failed to save task metadata.');
  }
}
