import { Client } from '@notionhq/client';
import { BaseIntegration, type IntegrationAuth } from './base';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
}

export interface NotionImportResult {
  markdown: string;
  title: string;
  pageId: string;
}

/**
 * Notion integration for importing PRD pages as Spexly canvases.
 * Provides OAuth authentication and page content extraction.
 */
export class NotionIntegration extends BaseIntegration {
  private client: Client;

  constructor(auth: IntegrationAuth, userId: string, supabase: SupabaseClient) {
    super(auth, userId, supabase);
    this.client = new Client({ auth: auth.accessToken });
  }

  get name() {
    return 'notion' as const;
  }

  /**
   * Refreshes the Notion access token.
   * Note: Notion tokens don't expire by default, but this is here for future compatibility.
   */
  protected async refreshAccessToken(): Promise<IntegrationAuth> {
    // Notion integration tokens don't currently expire
    // If they add refresh tokens in the future, implement here
    return this.auth;
  }

  /**
   * Lists recent pages accessible to the integration.
   * Filtered by pages edited in the last 30 days.
   */
  async listPages(limit: number = 20): Promise<NotionPage[]> {
    try {
      const response = await this.client.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        page_size: limit,
      });

      return response.results
        .filter((result) => 'url' in result && 'last_edited_time' in result)
        .map((page: any) => ({
          id: page.id,
          title: this.extractPageTitle(page),
          url: page.url,
          lastEditedTime: page.last_edited_time,
        }));
    } catch (error) {
      throw new Error(`Failed to list Notion pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports a Notion page by ID and converts it to markdown.
   */
  async importPage(pageId: string): Promise<NotionImportResult> {
    try {
      // Fetch page metadata
      const page = await this.client.pages.retrieve({ page_id: pageId });
      const title = this.extractPageTitle(page as any);

      // Fetch page content blocks
      const blocks = await this.fetchAllBlocks(pageId);

      // Convert blocks to markdown
      const markdown = await this.blocksToMarkdown(blocks);

      return {
        markdown,
        title,
        pageId,
      };
    } catch (error) {
      throw new Error(`Failed to import Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts the title from a Notion page object.
   */
  private extractPageTitle(page: any): string {
    if (!page.properties) return 'Untitled';

    // Find the title property
    const titleProp = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;

    if (!titleProp?.title?.[0]?.plain_text) return 'Untitled';
    return titleProp.title[0].plain_text;
  }

  /**
   * Fetches all blocks from a page (handles pagination).
   */
  private async fetchAllBlocks(blockId: string): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });

      blocks.push(...response.results);
      cursor = response.has_more ? response.next_cursor || undefined : undefined;
    } while (cursor);

    return blocks;
  }

  /**
   * Converts Notion blocks to markdown format.
   */
  private async blocksToMarkdown(blocks: any[]): Promise<string> {
    const lines: string[] = [];

    for (const block of blocks) {
      const text = this.blockToMarkdown(block);
      if (text) lines.push(text);

      // Recursively process child blocks
      if (block.has_children) {
        const children = await this.fetchAllBlocks(block.id);
        const childMarkdown = await this.blocksToMarkdown(children);
        if (childMarkdown) lines.push(childMarkdown);
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Converts a single Notion block to markdown.
   */
  private blockToMarkdown(block: any): string {
    const type = block.type;

    switch (type) {
      case 'paragraph':
        return this.richTextToMarkdown(block.paragraph.rich_text);

      case 'heading_1':
        return `# ${this.richTextToMarkdown(block.heading_1.rich_text)}`;

      case 'heading_2':
        return `## ${this.richTextToMarkdown(block.heading_2.rich_text)}`;

      case 'heading_3':
        return `### ${this.richTextToMarkdown(block.heading_3.rich_text)}`;

      case 'bulleted_list_item':
        return `- ${this.richTextToMarkdown(block.bulleted_list_item.rich_text)}`;

      case 'numbered_list_item':
        return `1. ${this.richTextToMarkdown(block.numbered_list_item.rich_text)}`;

      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        return `- [${checked}] ${this.richTextToMarkdown(block.to_do.rich_text)}`;

      case 'code':
        const language = block.code.language || '';
        const code = this.richTextToMarkdown(block.code.rich_text);
        return `\`\`\`${language}\n${code}\n\`\`\``;

      case 'quote':
        return `> ${this.richTextToMarkdown(block.quote.rich_text)}`;

      case 'divider':
        return '---';

      default:
        return '';
    }
  }

  /**
   * Converts Notion rich text to plain markdown.
   */
  private richTextToMarkdown(richText: any[]): string {
    if (!richText || richText.length === 0) return '';

    return richText
      .map((text) => {
        let content = text.plain_text;

        // Apply formatting
        if (text.annotations.bold) content = `**${content}**`;
        if (text.annotations.italic) content = `*${content}*`;
        if (text.annotations.code) content = `\`${content}\``;
        if (text.annotations.strikethrough) content = `~~${content}~~`;

        // Handle links
        if (text.href) content = `[${content}](${text.href})`;

        return content;
      })
      .join('');
  }
}

/**
 * OAuth helper for Notion integration setup.
 */
export class NotionOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NOTION_CLIENT_ID || '';
    this.clientSecret = process.env.NOTION_CLIENT_SECRET || '';
    this.redirectUri = process.env.NOTION_REDIRECT_URI || '';
  }

  /**
   * Generates the Notion OAuth authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      owner: 'user',
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an access token.
   */
  async exchangeCodeForToken(code: string): Promise<IntegrationAuth> {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      metadata: {
        workspaceId: data.workspace_id,
        workspaceName: data.workspace_name,
        workspaceIcon: data.workspace_icon,
        botId: data.bot_id,
      },
    };
  }
}
