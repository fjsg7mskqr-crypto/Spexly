import { BaseIntegration, type IntegrationAuth } from './base';

interface FigmaNode {
  id?: string;
  name?: string;
  type?: string;
  children?: FigmaNode[];
}

export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

export interface FigmaFrame {
  id: string;
  name: string;
  type: 'FRAME';
  children?: FigmaNode[];
}

export interface FigmaImportResult {
  screens: {
    screenName: string;
    purpose: string;
    keyElements: string[];
    wireframeUrl: string;
    notes: string;
  }[];
}

/**
 * Figma integration for importing design frames as Screen nodes.
 * Provides OAuth authentication and design extraction from Figma files.
 */
export class FigmaIntegration extends BaseIntegration {
  get name() {
    return 'figma' as const;
  }

  /**
   * Refreshes the Figma access token.
   */
  protected async refreshAccessToken(): Promise<IntegrationAuth> {
    if (!this.auth.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://api.figma.com/v1/oauth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.FIGMA_CLIENT_ID,
        client_secret: process.env.FIGMA_CLIENT_SECRET,
        refresh_token: this.auth.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Figma token');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Lists recent Figma files accessible to the user.
   */
  async listFiles(): Promise<FigmaFile[]> {
    const response = await this.fetchWithAuth('https://api.figma.com/v1/files/recent');

    if (!response.ok) {
      throw new Error('Failed to fetch Figma files');
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Extracts frames from a Figma file and converts them to Screen specifications.
   */
  async importFile(fileKey: string): Promise<FigmaImportResult> {
    // Fetch file data
    const response = await this.fetchWithAuth(`https://api.figma.com/v1/files/${fileKey}`);

    if (!response.ok) {
      throw new Error('Failed to fetch Figma file');
    }

    const fileData = await response.json();

    // Extract frames from document
    const frames = this.extractFrames(fileData.document as FigmaNode);

    // Convert frames to Screen specifications
    const screens = frames.map((frame) => ({
      screenName: frame.name,
      purpose: `UI design for ${frame.name}`,
      keyElements: this.extractElements(frame),
      wireframeUrl: `https://www.figma.com/file/${fileKey}?node-id=${frame.id}`,
      notes: `Imported from Figma file: ${fileData.name}`,
    }));

    return { screens };
  }

  /**
   * Recursively extracts all frames from Figma document structure.
   */
  private extractFrames(node: FigmaNode): FigmaFrame[] {
    const frames: FigmaFrame[] = [];

    if (node.type === 'FRAME' && typeof node.id === 'string') {
      frames.push({
        id: node.id,
        name: typeof node.name === 'string' ? node.name : 'Untitled Frame',
        type: 'FRAME',
        children: node.children,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        frames.push(...this.extractFrames(child));
      }
    }

    return frames;
  }

  /**
   * Extracts UI elements from a Figma frame based on child nodes.
   */
  private extractElements(frame: FigmaFrame): string[] {
    if (!frame.children) return [];

    const elements: string[] = [];

    for (const child of frame.children) {
      const elementName = child.name || 'Unnamed element';
      const elementType = this.inferElementType(child);
      elements.push(`${elementType}: ${elementName}`);
    }

    return elements.slice(0, 12); // Limit to 12 elements
  }

  /**
   * Infers UI element type from Figma node properties.
   */
  private inferElementType(node: FigmaNode): string {
    const name = (node.name || '').toLowerCase();

    if (name.includes('button') || name.includes('btn')) return 'Button';
    if (name.includes('input') || name.includes('field')) return 'Input';
    if (name.includes('text') || node.type === 'TEXT') return 'Text';
    if (name.includes('image') || name.includes('img')) return 'Image';
    if (name.includes('icon')) return 'Icon';
    if (name.includes('card')) return 'Card';
    if (name.includes('list')) return 'List';
    if (name.includes('modal') || name.includes('dialog')) return 'Modal';

    return 'Component';
  }
}

/**
 * OAuth helper for Figma integration setup.
 */
export class FigmaOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.FIGMA_CLIENT_ID || '';
    this.clientSecret = process.env.FIGMA_CLIENT_SECRET || '';
    this.redirectUri = process.env.FIGMA_REDIRECT_URI || '';
  }

  /**
   * Generates the Figma OAuth authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'file_read',
      state,
      response_type: 'code',
    });

    return `https://www.figma.com/oauth?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an access token.
   */
  async exchangeCodeForToken(code: string): Promise<IntegrationAuth> {
    const response = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      metadata: {
        userId: data.user_id,
      },
    };
  }
}
