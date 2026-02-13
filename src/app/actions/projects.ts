'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { Project, CanvasData } from '@/types/project';
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';
import {
  validateProjectName,
  validateCanvasData,
  validateProjectId,
} from '@/lib/validation/validators';
import {
  AuthenticationError,
  DatabaseError,
  ValidationError,
  RateLimitError,
  logError,
} from '@/lib/errors';
import {
  projectRateLimiter,
  canvasSaveRateLimiter,
  checkRateLimit,
} from '@/lib/rate-limit/limiter';

/**
 * Validates the origin and referer headers to prevent CSRF attacks
 * This provides an additional layer of security beyond Next.js Server Actions' built-in protections
 * @throws {ValidationError} if origin validation fails
 */
async function validateOrigin(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');

  // Define allowed origins for different environments
  const allowedOrigins = [
    'http://localhost:3000', // Development
    'http://localhost:3001', // Development alternative
    'https://spexly.com', // Production
    'https://www.spexly.com', // Production with www
    'https://spexly.vercel.app', // Vercel preview
  ];

  // For development, also allow any localhost origin
  if (process.env.NODE_ENV === 'development') {
    if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
      return; // Allow in development
    }
  }

  // Check origin header (present on POST requests)
  if (origin && !allowedOrigins.includes(origin)) {
    logError(new Error('Invalid origin'), { origin, referer });
    throw new ValidationError('Request origin not allowed');
  }

  // Check referer header as fallback
  if (!origin && referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;

    if (!allowedOrigins.includes(refererOrigin)) {
      logError(new Error('Invalid referer'), { referer });
      throw new ValidationError('Request referer not allowed');
    }
  }

  // If neither origin nor referer is present, this might be suspicious
  // but we'll allow it as some legitimate requests may not have these headers
  if (!origin && !referer && process.env.NODE_ENV === 'production') {
    logError(new Error('Missing origin and referer headers'), { headers: headersList });
    // Log but don't block to avoid breaking legitimate use cases
  }
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError();
  return user.id;
}

async function getUserTier(): Promise<'free' | 'pro'> {
  // TODO: Re-enable tier checks once profiles table is created in Supabase
  // and a payment system is integrated. For now, all users get pro access.
  return 'pro';
}

export async function getProjects(): Promise<Project[]> {
  try {
    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      logError(error, { action: 'getProjects', userId });
      throw new DatabaseError('Failed to fetch projects');
    }

    return (data ?? []) as unknown as Project[];
  } catch (error) {
    // If it's already one of our custom errors, rethrow
    if (error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    // Log and throw generic error for unexpected errors
    logError(error, { action: 'getProjects' });
    throw new DatabaseError('Failed to fetch projects');
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    // Validate project ID format
    const idValidation = validateProjectId(id);
    if (!idValidation.valid) {
      throw new ValidationError(idValidation.error || 'Invalid project ID');
    }

    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      // If not found, return null (expected behavior)
      if (error.code === 'PGRST116') {
        return null;
      }
      logError(error, { action: 'getProject', userId, projectId: id });
      throw new DatabaseError('Failed to fetch project');
    }

    return data as unknown as Project;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'getProject', projectId: id });
    throw new DatabaseError('Failed to fetch project');
  }
}

export async function createProject(name?: string): Promise<Project> {
  try {
    // Validate origin to prevent CSRF attacks
    await validateOrigin();

    const userId = await getAuthUserId();

    // Rate limit project creation
    const rateLimitResult = await checkRateLimit(projectRateLimiter, userId);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many requests. Please slow down.');
    }

    // Check tier limits (free tier: 3 projects max)
    const tier = await getUserTier();
    if (tier === 'free') {
      const supabase = await createClient();
      const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logError(countError, { action: 'createProject:checkCount', userId });
      }

      if ((count || 0) >= 3) {
        throw new ValidationError(
          'Free tier limited to 3 projects. Upgrade to Pro for unlimited projects.'
        );
      }
    }

    // Use default name if not provided
    const projectName = name || 'Untitled Project';

    // Validate project name
    const validation = validateProjectName(projectName);
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid project name');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: validation.sanitized,
      })
      .select()
      .single();

    if (error) {
      logError(error, { action: 'createProject', userId });
      throw new DatabaseError('Failed to create project');
    }

    return data as unknown as Project;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'createProject' });
    throw new DatabaseError('Failed to create project');
  }
}

export async function createProjectFromWizard(
  name: string,
  nodes: SpexlyNode[],
  edges: SpexlyEdge[],
): Promise<Project> {
  try {
    // Validate origin to prevent CSRF attacks
    await validateOrigin();

    const userId = await getAuthUserId();

    // Rate limit project creation
    const rateLimitResult = await checkRateLimit(projectRateLimiter, userId);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many requests. Please slow down.');
    }

    // Check tier limits
    const tier = await getUserTier();

    // Free tier: 3 projects max
    if (tier === 'free') {
      const supabase = await createClient();
      const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logError(countError, { action: 'createProjectFromWizard:checkCount', userId });
      }

      if ((count || 0) >= 3) {
        throw new ValidationError(
          'Free tier limited to 3 projects. Upgrade to Pro for unlimited projects.'
        );
      }

      // Free tier: 30 nodes max
      if (nodes.length > 30) {
        throw new ValidationError(
          'Free tier limited to 30 nodes per project. Upgrade to Pro for unlimited nodes.'
        );
      }
    }

    // Validate project name
    const nameValidation = validateProjectName(name);
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.error || 'Invalid project name');
    }

    // Validate canvas data
    const canvasValidation = validateCanvasData(nodes, edges);
    if (!canvasValidation.valid) {
      throw new ValidationError(canvasValidation.error || 'Invalid canvas data');
    }

    const supabase = await createClient();

    const canvasData: CanvasData = {
      nodes: canvasValidation.sanitizedNodes!,
      edges: canvasValidation.sanitizedEdges!,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: nameValidation.sanitized,
        canvas_data: canvasData as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      logError(error, { action: 'createProjectFromWizard', userId });
      throw new DatabaseError('Failed to create project');
    }

    return data as unknown as Project;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'createProjectFromWizard' });
    throw new DatabaseError('Failed to create project');
  }
}

export async function updateCanvasData(
  id: string,
  nodes: SpexlyNode[],
  edges: SpexlyEdge[],
): Promise<void> {
  try {
    // Validate origin to prevent CSRF attacks
    await validateOrigin();

    const userId = await getAuthUserId();

    // Rate limit canvas saves to prevent spam
    const rateLimitResult = await checkRateLimit(canvasSaveRateLimiter, userId);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many save requests. Please wait a moment.');
    }

    // Check tier limits (free tier: 30 nodes max)
    const tier = await getUserTier();
    if (tier === 'free' && nodes.length > 30) {
      throw new ValidationError(
        'Free tier limited to 30 nodes per project. Upgrade to Pro for unlimited nodes.'
      );
    }

    // Validate project ID
    const idValidation = validateProjectId(id);
    if (!idValidation.valid) {
      throw new ValidationError(idValidation.error || 'Invalid project ID');
    }

    // Validate canvas data
    const canvasValidation = validateCanvasData(nodes, edges);
    if (!canvasValidation.valid) {
      throw new ValidationError(canvasValidation.error || 'Invalid canvas data');
    }
    const supabase = await createClient();

    const canvasData: CanvasData = {
      nodes: canvasValidation.sanitizedNodes!,
      edges: canvasValidation.sanitizedEdges!,
    };

    const { error } = await supabase
      .from('projects')
      .update({ canvas_data: canvasData as unknown as Record<string, unknown> })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logError(error, { action: 'updateCanvasData', userId, projectId: id });
      throw new DatabaseError('Failed to update canvas data');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'updateCanvasData', projectId: id });
    throw new DatabaseError('Failed to update canvas data');
  }
}

export async function renameProject(id: string, name: string): Promise<void> {
  try {
    // Validate origin to prevent CSRF attacks
    await validateOrigin();

    const userId = await getAuthUserId();

    // Rate limit project operations
    const rateLimitResult = await checkRateLimit(projectRateLimiter, userId);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many requests. Please slow down.');
    }

    // Validate project ID
    const idValidation = validateProjectId(id);
    if (!idValidation.valid) {
      throw new ValidationError(idValidation.error || 'Invalid project ID');
    }

    // Validate project name
    const nameValidation = validateProjectName(name);
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.error || 'Invalid project name');
    }
    const supabase = await createClient();

    const { error } = await supabase
      .from('projects')
      .update({ name: nameValidation.sanitized })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logError(error, { action: 'renameProject', userId, projectId: id });
      throw new DatabaseError('Failed to rename project');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'renameProject', projectId: id });
    throw new DatabaseError('Failed to rename project');
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    // Validate origin to prevent CSRF attacks
    await validateOrigin();

    const userId = await getAuthUserId();

    // Rate limit project operations
    const rateLimitResult = await checkRateLimit(projectRateLimiter, userId);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many requests. Please slow down.');
    }

    // Validate project ID
    const idValidation = validateProjectId(id);
    if (!idValidation.valid) {
      throw new ValidationError(idValidation.error || 'Invalid project ID');
    }
    const supabase = await createClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logError(error, { action: 'deleteProject', userId, projectId: id });
      throw new DatabaseError('Failed to delete project');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof DatabaseError) {
      throw error;
    }
    logError(error, { action: 'deleteProject', projectId: id });
    throw new DatabaseError('Failed to delete project');
  }
}
