'use server';

import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, DatabaseError, ValidationError, logError } from '@/lib/errors';
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

export interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  canvas_data: { nodes: SpexlyNode[]; edges: SpexlyEdge[] };
  created_at: string;
  updated_at: string;
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError();
  return user.id;
}

export async function getUserTemplates(): Promise<UserTemplate[]> {
  try {
    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      logError(error, { action: 'getUserTemplates', userId });
      throw new DatabaseError('Failed to fetch templates.');
    }

    return (data ?? []) as UserTemplate[];
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof DatabaseError) throw error;
    logError(error, { action: 'getUserTemplates' });
    throw new DatabaseError('Failed to fetch templates.');
  }
}

export async function saveUserTemplate(
  name: string,
  description: string | null,
  nodes: SpexlyNode[],
  edges: SpexlyEdge[]
): Promise<UserTemplate> {
  try {
    if (!name.trim()) {
      throw new ValidationError('Template name is required.');
    }

    const normalizedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        expanded: false,
      },
    })) as SpexlyNode[];

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_templates')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        canvas_data: { nodes: normalizedNodes, edges },
      })
      .select()
      .single();

    if (error || !data) {
      logError(error, { action: 'saveUserTemplate', userId });
      throw new DatabaseError('Failed to save template.');
    }

    return data as UserTemplate;
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'saveUserTemplate' });
    throw new DatabaseError('Failed to save template.');
  }
}

export async function deleteUserTemplate(templateId: string): Promise<void> {
  try {
    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('user_id', userId)
      .eq('id', templateId);

    if (error) {
      logError(error, { action: 'deleteUserTemplate', userId, templateId });
      throw new DatabaseError('Failed to delete template.');
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof DatabaseError) throw error;
    logError(error, { action: 'deleteUserTemplate', templateId });
    throw new DatabaseError('Failed to delete template.');
  }
}
