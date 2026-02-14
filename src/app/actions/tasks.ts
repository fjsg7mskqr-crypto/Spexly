'use server';

import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  DatabaseError,
  ValidationError,
  logError,
} from '@/lib/errors';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
type LinkableNodeType = 'idea' | 'feature' | 'screen' | 'techStack' | 'prompt' | 'note';

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

const LINKABLE_NODE_TYPES = new Set<LinkableNodeType>([
  'idea',
  'feature',
  'screen',
  'techStack',
  'prompt',
  'note',
]);

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

function toExternalRef(projectId: string, nodeId: string, title: string): string {
  const digest = createHash('sha256')
    .update(`${projectId}:${nodeId}:${title.toLowerCase()}`)
    .digest('hex')
    .slice(0, 16);
  return `prompt-breakdown:${nodeId}:${digest}`;
}

export async function syncPromptBreakdownTasks(
  projectId: string,
  nodeId: string,
  nodeType: LinkableNodeType,
  breakdown: string[],
  sourceAgent?: string
): Promise<void> {
  try {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required.');
    }
    if (!nodeId?.trim()) {
      throw new ValidationError('Node ID is required.');
    }
    if (!LINKABLE_NODE_TYPES.has(nodeType)) {
      throw new ValidationError('Invalid node type.');
    }

    const normalized = breakdown
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.slice(0, 180))
      .slice(0, 20);

    if (normalized.length === 0) {
      return;
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new ValidationError('Project not found.');
    }

    const rows = normalized.map((title) => ({
      user_id: userId,
      project_id: projectId,
      node_id: nodeId,
      node_type: nodeType,
      link_confidence: 1,
      title,
      details: null,
      status: 'todo' as TaskStatus,
      source: 'agent',
      source_agent: sourceAgent?.trim().slice(0, 64) || 'prompt-node',
      external_ref: toExternalRef(projectId, nodeId, title),
      metadata: {
        source: 'prompt-breakdown',
        nodeId,
      },
    }));

    const { error } = await supabase
      .from('task_items')
      .upsert(rows, { onConflict: 'project_id,external_ref' });

    if (error) {
      if (isMissingTaskTableError(error)) {
        throw new ValidationError('Task system is not initialized yet. Run latest database migrations.');
      }
      logError(error, { action: 'syncPromptBreakdownTasks', userId, projectId, nodeId });
      throw new DatabaseError('Failed to sync prompt breakdown tasks.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'syncPromptBreakdownTasks', projectId, nodeId });
    throw new DatabaseError('Failed to sync prompt breakdown tasks.');
  }
}

export async function linkTaskToNode(
  taskId: string,
  nodeId: string,
  nodeType: LinkableNodeType
): Promise<void> {
  try {
    if (!taskId?.trim()) {
      throw new ValidationError('Task ID is required.');
    }
    if (!nodeId?.trim()) {
      throw new ValidationError('Node ID is required.');
    }
    if (!LINKABLE_NODE_TYPES.has(nodeType)) {
      throw new ValidationError('Invalid node type.');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('task_items')
      .update({
        node_id: nodeId,
        node_type: nodeType,
        link_confidence: 1,
      })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      if (isMissingTaskTableError(error)) {
        throw new ValidationError('Task system is not initialized yet. Run latest database migrations.');
      }
      logError(error, { action: 'linkTaskToNode', userId, taskId, nodeId, nodeType });
      throw new DatabaseError('Failed to link task to node.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'linkTaskToNode', taskId, nodeId, nodeType });
    throw new DatabaseError('Failed to link task to node.');
  }
}
