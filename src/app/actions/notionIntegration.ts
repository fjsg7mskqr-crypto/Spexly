'use server';

import { Client } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, logError } from '@/lib/errors';

/**
 * Get Notion pages accessible to the connected integration.
 * Returns list of pages with titles and IDs.
 */
export async function listNotionPages(): Promise<{
  success: boolean;
  pages?: Array<{ id: string; title: string; url: string }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to use Notion integration.');
    }

    // Get Notion access token from integrations table
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'notion')
      .single();

    if (!integration?.access_token) {
      return {
        success: false,
        error: 'Notion not connected. Please connect your Notion account first.',
      };
    }

    const notion = new Client({ auth: integration.access_token });

    // Search for pages (Notion API returns max 100 by default)
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
      page_size: 20, // Limit to 20 most recent
    });

    const pages = response.results
      .filter((page): page is any => 'properties' in page && !!page.properties.title)
      .map((page) => {
        // Extract title from page properties
        const titleProp = page.properties.title || page.properties.Title || page.properties.Name;
        let title = 'Untitled';

        if (titleProp && 'title' in titleProp && Array.isArray(titleProp.title) && titleProp.title[0]) {
          title = titleProp.title[0].plain_text || 'Untitled';
        }

        return {
          id: page.id,
          title,
          url: page.url,
        };
      });

    return {
      success: true,
      pages,
    };
  } catch (error) {
    logError(error, { action: 'listNotionPages' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Notion pages',
    };
  }
}

/**
 * Import a Notion page content and convert to Spexly canvas format.
 */
export async function importNotionPage(pageId: string): Promise<{
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in.');
    }

    // Get Notion access token
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'notion')
      .single();

    if (!integration?.access_token) {
      return {
        success: false,
        error: 'Notion not connected.',
      };
    }

    const notion = new Client({ auth: integration.access_token });

    // Get page details
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Get page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    // Convert blocks to markdown-like text
    const content = blocks.results
      .map((block: any) => {
        if (!block.type) return '';

        // Extract text from different block types
        switch (block.type) {
          case 'paragraph':
            return block.paragraph?.rich_text?.map((t: any) => t.plain_text).join('') || '';
          case 'heading_1':
            return '# ' + (block.heading_1?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          case 'heading_2':
            return '## ' + (block.heading_2?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          case 'heading_3':
            return '### ' + (block.heading_3?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          case 'bulleted_list_item':
            return '- ' + (block.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          case 'numbered_list_item':
            return '1. ' + (block.numbered_list_item?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          case 'code':
            return '```\n' + (block.code?.rich_text?.map((t: any) => t.plain_text).join('') || '') + '\n```';
          case 'quote':
            return '> ' + (block.quote?.rich_text?.map((t: any) => t.plain_text).join('') || '');
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');

    // Extract title
    let title = 'Untitled';
    if ('properties' in page) {
      const titleProp = (page as any).properties.title || (page as any).properties.Title || (page as any).properties.Name;
      if (titleProp && 'title' in titleProp && Array.isArray(titleProp.title) && titleProp.title[0]) {
        title = titleProp.title[0].plain_text || 'Untitled';
      }
    }

    return {
      success: true,
      content,
      title,
    };
  } catch (error) {
    logError(error, { action: 'importNotionPage', pageId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import Notion page',
    };
  }
}

/**
 * Check if user has connected Notion integration.
 */
export async function checkNotionConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { connected: false };
    }

    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'notion')
      .single();

    return { connected: Boolean(integration?.access_token) };
  } catch (error) {
    return { connected: false };
  }
}

/**
 * Disconnect Notion integration.
 */
export async function disconnectNotion(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Not logged in');
    }

    await supabase.from('integrations').delete().eq('user_id', user.id).eq('provider', 'notion');

    return { success: true };
  } catch (error) {
    logError(error, { action: 'disconnectNotion' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect',
    };
  }
}
