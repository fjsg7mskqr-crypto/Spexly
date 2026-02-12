import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface IntegrationAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export type IntegrationProvider = 'notion' | 'figma' | 'linear';

/**
 * Base class for all third-party integrations.
 * Provides common OAuth token management and API request handling.
 */
export abstract class BaseIntegration {
  protected auth: IntegrationAuth;
  protected userId: string;
  protected supabase: SupabaseClient;

  constructor(auth: IntegrationAuth, userId: string, supabase: SupabaseClient) {
    this.auth = auth;
    this.userId = userId;
    this.supabase = supabase;
  }

  /**
   * Returns the provider name (notion, figma, linear)
   */
  abstract get name(): IntegrationProvider;

  /**
   * Refreshes the access token if it's expired or about to expire.
   * Must be implemented by each integration.
   */
  protected abstract refreshAccessToken(): Promise<IntegrationAuth>;

  /**
   * Makes an authenticated HTTP request with automatic token refresh.
   * Handles token expiration and retries with refreshed token.
   */
  protected async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if token needs refresh (within 5 minutes of expiry)
    if (this.auth.expiresAt) {
      const now = new Date();
      const expiryBuffer = new Date(this.auth.expiresAt.getTime() - 5 * 60 * 1000); // 5 min before
      if (now >= expiryBuffer) {
        await this.refreshAndSaveToken();
      }
    }

    // Add auth header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.auth.accessToken}`,
    };

    const response = await fetch(url, { ...options, headers });

    // If 401, try refreshing token once
    if (response.status === 401 && this.auth.refreshToken) {
      await this.refreshAndSaveToken();
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${this.auth.accessToken}`,
      };
      return fetch(url, { ...options, headers: retryHeaders });
    }

    return response;
  }

  /**
   * Refreshes the access token and saves it to the database.
   */
  private async refreshAndSaveToken(): Promise<void> {
    const newAuth = await this.refreshAccessToken();
    this.auth = newAuth;

    // Save to database
    const { error } = await this.supabase
      .from('integrations')
      .update({
        access_token: newAuth.accessToken,
        refresh_token: newAuth.refreshToken || null,
        token_expires_at: newAuth.expiresAt?.toISOString() || null,
        metadata: newAuth.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId)
      .eq('provider', this.name);

    if (error) {
      throw new Error(`Failed to save refreshed token: ${error.message}`);
    }
  }

  /**
   * Loads integration credentials from the database for a user.
   */
  static async loadForUser(
    provider: IntegrationProvider,
    userId: string
  ): Promise<IntegrationAuth | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
      metadata: (data.metadata as Record<string, unknown>) || {},
    };
  }

  /**
   * Saves integration credentials to the database.
   */
  static async saveForUser(
    provider: IntegrationProvider,
    userId: string,
    auth: IntegrationAuth
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('integrations').upsert(
      {
        user_id: userId,
        provider,
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken || null,
        token_expires_at: auth.expiresAt?.toISOString() || null,
        metadata: auth.metadata || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

    if (error) {
      throw new Error(`Failed to save integration: ${error.message}`);
    }
  }

  /**
   * Deletes integration credentials from the database.
   */
  static async deleteForUser(provider: IntegrationProvider, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw new Error(`Failed to delete integration: ${error.message}`);
    }
  }
}
