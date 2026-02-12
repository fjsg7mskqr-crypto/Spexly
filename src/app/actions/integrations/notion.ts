'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { NotionIntegration, NotionOAuth, type NotionPage } from '@/lib/integrations/notion';
import { BaseIntegration } from '@/lib/integrations/base';
import { importDocumentWithAI } from '@/app/actions/import';
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
  logError,
} from '@/lib/errors';

/**
 * Generates the Notion OAuth authorization URL for user to connect their workspace.
 */
export async function getNotionAuthUrl(): Promise<{ url: string }> {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Generate OAuth URL with state parameter (could add CSRF token here)
    const oauth = new NotionOAuth();
    const state = `user:${user.id}:${Date.now()}`;
    const url = oauth.getAuthorizationUrl(state);

    return { url };
  } catch (error) {
    logError(error, { action: 'getNotionAuthUrl' });
    throw new DatabaseError('Failed to generate Notion authorization URL');
  }
}

/**
 * Lists recent Notion pages accessible to the user's connected integration.
 */
export async function listNotionPages(): Promise<NotionPage[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Load Notion integration credentials
    const auth = await BaseIntegration.loadForUser('notion', user.id);
    if (!auth) {
      throw new ValidationError('Notion integration not connected. Please connect your Notion workspace first.');
    }

    // Create Notion client and list pages
    const notion = new NotionIntegration(auth, user.id, supabase);
    const pages = await notion.listPages(20);

    return pages;
  } catch (error) {
    logError(error, { action: 'listNotionPages' });
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to list Notion pages');
  }
}

/**
 * Imports a Notion page as a Spexly canvas.
 * Converts page content to markdown, then uses AI to extract structured fields.
 */
export async function importFromNotion(
  pageId: string
): Promise<{ nodes: SpexlyNode[]; edges: SpexlyEdge[] }> {
  try {
    if (!pageId || pageId.trim().length === 0) {
      throw new ValidationError('Page ID is required');
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Load Notion integration credentials
    const auth = await BaseIntegration.loadForUser('notion', user.id);
    if (!auth) {
      throw new ValidationError('Notion integration not connected');
    }

    // Import page content
    const notion = new NotionIntegration(auth, user.id, supabase);
    const { markdown, title } = await notion.importPage(pageId);

    // Use existing AI import flow to convert markdown to canvas
    const result = await importDocumentWithAI(markdown);

    // Update the idea node with the Notion page title if available
    const ideaNode = result.nodes.find((node) => node.type === 'idea');
    if (ideaNode && title && title !== 'Untitled') {
      ideaNode.data = {
        ...ideaNode.data,
        appName: title,
      };
    }

    return {
      nodes: result.nodes,
      edges: result.edges,
    };
  } catch (error) {
    logError(error, { action: 'importFromNotion', pageId });
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to import from Notion');
  }
}

/**
 * Disconnects the Notion integration by deleting stored credentials.
 */
export async function disconnectNotion(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    await BaseIntegration.deleteForUser('notion', user.id);

    return { success: true };
  } catch (error) {
    logError(error, { action: 'disconnectNotion' });
    throw new DatabaseError('Failed to disconnect Notion');
  }
}
