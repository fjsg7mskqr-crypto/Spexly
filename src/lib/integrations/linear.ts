import { BaseIntegration, type IntegrationAuth } from './base';

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssue {
  id: string;
  title: string;
  identifier: string;
  url: string;
  state: {
    name: string;
    type: string;
  };
}

export interface FeatureExportInput {
  featureName: string;
  summary: string;
  problem: string;
  acceptanceCriteria: string[];
  priority: string;
  effort: string;
}

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

/**
 * Linear integration for syncing features as issues.
 * Provides OAuth authentication, issue creation, and status sync via webhooks.
 */
export class LinearIntegration extends BaseIntegration {
  private readonly apiUrl = 'https://api.linear.app/graphql';

  get name() {
    return 'linear' as const;
  }

  /**
   * Refreshes the Linear access token.
   * Note: Linear tokens are long-lived and don't expire, but refresh is supported.
   */
  protected async refreshAccessToken(): Promise<IntegrationAuth> {
    // Linear tokens are currently long-lived and don't require refresh
    // If Linear adds token expiration, implement refresh here
    return this.auth;
  }

  /**
   * Lists teams accessible to the user.
   */
  async listTeams(): Promise<LinearTeam[]> {
    const query = `
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `;

    const data = await this.graphqlRequest<{ teams: { nodes: LinearTeam[] } }>(query);
    return data.teams.nodes;
  }

  /**
   * Exports a feature as a Linear issue.
   */
  async exportFeatureAsIssue(teamId: string, feature: FeatureExportInput): Promise<LinearIssue> {
    const description = this.buildIssueDescription(feature);

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            title
            identifier
            url
            state {
              name
              type
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        teamId,
        title: feature.featureName,
        description,
        priority: this.mapPriorityToLinear(feature.priority),
        estimate: this.mapEffortToEstimate(feature.effort),
      },
    };

    const data = await this.graphqlRequest<{
      issueCreate: { success: boolean; issue: LinearIssue };
    }>(mutation, variables);

    if (!data.issueCreate.success) {
      throw new Error('Failed to create Linear issue');
    }

    return data.issueCreate.issue;
  }

  /**
   * Fetches issue details by ID.
   */
  async getIssue(issueId: string): Promise<LinearIssue> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
          identifier
          url
          state {
            name
            type
          }
        }
      }
    `;

    const data = await this.graphqlRequest<{ issue: LinearIssue }>(query, { id: issueId });
    return data.issue;
  }

  /**
   * Updates an issue's state.
   */
  async updateIssueState(issueId: string, stateId: string): Promise<boolean> {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
        }
      }
    `;

    const variables = {
      id: issueId,
      input: {
        stateId,
      },
    };

    const data = await this.graphqlRequest<{ issueUpdate: { success: boolean } }>(mutation, variables);
    return data.issueUpdate.success;
  }

  /**
   * Makes a GraphQL request to Linear API.
   */
  private async graphqlRequest<TData>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<TData> {
    const response = await this.fetchWithAuth(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Linear API request failed: ${response.statusText}`);
    }

    const result = (await response.json()) as GraphQLResponse<TData>;

    if (result.errors?.length) {
      throw new Error(`Linear GraphQL error: ${result.errors[0].message}`);
    }

    if (!result.data) {
      throw new Error('Linear GraphQL response missing data');
    }

    return result.data;
  }

  /**
   * Builds issue description from feature data.
   */
  private buildIssueDescription(feature: FeatureExportInput): string {
    const parts = [
      `## Problem\n${feature.problem}`,
      `## Summary\n${feature.summary}`,
    ];

    if (feature.acceptanceCriteria.length > 0) {
      parts.push(
        `## Acceptance Criteria\n${feature.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}`
      );
    }

    parts.push(`\n---\n_Exported from Spexly_`);

    return parts.join('\n\n');
  }

  /**
   * Maps Spexly priority to Linear priority (1-4).
   */
  private mapPriorityToLinear(priority: string): number {
    switch (priority) {
      case 'Must':
        return 1; // Urgent
      case 'Should':
        return 2; // High
      case 'Nice':
        return 3; // Medium
      default:
        return 2;
    }
  }

  /**
   * Maps Spexly effort to Linear estimate (story points).
   */
  private mapEffortToEstimate(effort: string): number {
    switch (effort) {
      case 'XS':
        return 1;
      case 'S':
        return 2;
      case 'M':
        return 5;
      case 'L':
        return 8;
      case 'XL':
        return 13;
      default:
        return 5;
    }
  }
}

/**
 * OAuth helper for Linear integration setup.
 */
export class LinearOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.LINEAR_CLIENT_ID || '';
    this.clientSecret = process.env.LINEAR_CLIENT_SECRET || '';
    this.redirectUri = process.env.LINEAR_REDIRECT_URI || '';
  }

  /**
   * Generates the Linear OAuth authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read,write',
      state,
    });

    return `https://linear.app/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an access token.
   */
  async exchangeCodeForToken(code: string): Promise<IntegrationAuth> {
    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
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
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }
}
