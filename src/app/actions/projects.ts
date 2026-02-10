'use server';

import { createClient } from '@/lib/supabase/server';
import type { Project, CanvasData } from '@/types/project';
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getProjects(): Promise<Project[]> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as unknown as Project;
}

export async function createProject(name?: string): Promise<Project> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: name || 'Untitled Project',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Project;
}

export async function createProjectFromWizard(
  name: string,
  nodes: SpexlyNode[],
  edges: SpexlyEdge[],
): Promise<Project> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const canvasData: CanvasData = { nodes, edges };

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      canvas_data: canvasData as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Project;
}

export async function updateCanvasData(
  id: string,
  nodes: SpexlyNode[],
  edges: SpexlyEdge[],
): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const canvasData: CanvasData = { nodes, edges };

  const { error } = await supabase
    .from('projects')
    .update({ canvas_data: canvasData as unknown as Record<string, unknown> })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
