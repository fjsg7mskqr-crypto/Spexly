/**
 * Deterministic keyword matching for scoring relevance between
 * a prompt's text and feature/screen names + summaries.
 * No AI calls — fast and synchronous.
 */

/** Synonym groups for common software concepts */
const SYNONYM_GROUPS: string[][] = [
  ['auth', 'authentication', 'login', 'signup', 'register', 'password', 'session', 'oauth'],
  ['database', 'db', 'schema', 'table', 'model', 'data model', 'migration', 'orm', 'rls'],
  ['dashboard', 'analytics', 'stats', 'metrics', 'chart', 'graph', 'reporting'],
  ['ui', 'interface', 'component', 'layout', 'screen', 'page', 'view', 'design'],
  ['api', 'endpoint', 'route', 'rest', 'graphql', 'server', 'backend'],
  ['payment', 'billing', 'stripe', 'subscription', 'checkout', 'pricing', 'plan'],
  ['search', 'filter', 'query', 'sort', 'facet', 'index'],
  ['upload', 'file', 'image', 'media', 'storage', 'blob', 'asset'],
  ['notification', 'email', 'alert', 'push', 'message', 'sms'],
  ['test', 'testing', 'spec', 'coverage', 'unit', 'integration', 'e2e'],
  ['deploy', 'hosting', 'ci', 'cd', 'pipeline', 'vercel', 'docker'],
  ['user', 'profile', 'account', 'settings', 'preferences'],
  ['team', 'workspace', 'organization', 'collaboration', 'invite', 'member', 'role'],
  ['editor', 'rich text', 'markdown', 'content', 'publish', 'draft'],
  ['list', 'listing', 'catalog', 'inventory', 'product', 'item'],
  ['navigation', 'nav', 'sidebar', 'menu', 'header', 'footer', 'breadcrumb'],
  ['form', 'input', 'validation', 'submit', 'field'],
  ['onboarding', 'setup', 'wizard', 'tutorial', 'walkthrough'],
];

/** Tokenize text into lowercase words */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Get all synonyms for a token */
function getSynonyms(token: string): Set<string> {
  const result = new Set<string>([token]);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((word) => token.includes(word) || word.includes(token))) {
      for (const word of group) {
        result.add(word);
      }
    }
  }
  return result;
}

/** Score how relevant a candidate text is to a prompt */
function scoreRelevance(promptTokens: Set<string>, promptSynonyms: Set<string>, candidateText: string): number {
  const candidateTokens = tokenize(candidateText);
  if (candidateTokens.length === 0) return 0;

  let directMatches = 0;
  let synonymMatches = 0;

  for (const token of candidateTokens) {
    if (promptTokens.has(token)) {
      directMatches++;
    } else if (promptSynonyms.has(token)) {
      synonymMatches++;
    }
  }

  // Direct matches are worth 1.0, synonym matches 0.6
  const score = (directMatches + synonymMatches * 0.6) / Math.max(candidateTokens.length, 1);
  return Math.min(score, 1.0);
}

export interface ScoredItem<T> {
  item: T;
  score: number;
}

/**
 * Rank features by relevance to a prompt's text.
 * Returns all features sorted by relevance score (descending), with scores > 0.
 */
export function rankFeatures<T extends { featureName: string; summary?: string }>(
  promptText: string,
  features: T[],
  minScore: number = 0.08,
): ScoredItem<T>[] {
  const tokens = new Set(tokenize(promptText));
  const synonyms = new Set<string>();
  for (const token of tokens) {
    for (const syn of getSynonyms(token)) {
      synonyms.add(syn);
    }
  }

  return features
    .map((item) => {
      const nameScore = scoreRelevance(tokens, synonyms, item.featureName);
      const summaryScore = item.summary ? scoreRelevance(tokens, synonyms, item.summary) * 0.7 : 0;
      return { item, score: Math.max(nameScore, summaryScore) };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Rank screens by relevance to a prompt's text.
 */
export function rankScreens<T extends { screenName: string; purpose?: string }>(
  promptText: string,
  screens: T[],
  minScore: number = 0.08,
): ScoredItem<T>[] {
  const tokens = new Set(tokenize(promptText));
  const synonyms = new Set<string>();
  for (const token of tokens) {
    for (const syn of getSynonyms(token)) {
      synonyms.add(syn);
    }
  }

  return screens
    .map((item) => {
      const nameScore = scoreRelevance(tokens, synonyms, item.screenName);
      const purposeScore = item.purpose ? scoreRelevance(tokens, synonyms, item.purpose) * 0.7 : 0;
      return { item, score: Math.max(nameScore, purposeScore) };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}
