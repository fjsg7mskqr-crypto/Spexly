import type { ExistingNodeSummary, NodeMatch, SpexlyNodeType } from '@/types/nodes';

/** Lowercase, strip type suffixes (Screen, Page, Feature, etc.), remove punctuation */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(screen|page|feature|view|component|module)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Standard Levenshtein edit distance */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/** Normalized similarity score (0–1), with substring containment boost */
export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  // Substring containment boost
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return 1 - dist / maxLen;
}

interface ExtractedItem {
  name: string;
  type: SpexlyNodeType;
}

interface MatchResult {
  matches: NodeMatch[];
  unmatched: ExtractedItem[];
}

const MATCH_THRESHOLD = 0.6;

/** Maps extracted AI types to canvas node types */
function mapExtractedType(type: string): SpexlyNodeType | null {
  const map: Record<string, SpexlyNodeType> = {
    feature: 'feature',
    screen: 'screen',
    techStack: 'techStack',
    idea: 'idea',
  };
  return map[type] ?? null;
}

/**
 * Fuzzy-matches extracted items to existing canvas nodes.
 * Only matches within the same node type. Greedy: highest confidence first, no double-matching.
 */
export function matchExtractedToExisting(
  extracted: ExtractedItem[],
  existing: ExistingNodeSummary[]
): MatchResult {
  // Build all candidate pairs with scores
  const candidates: { extracted: ExtractedItem; existing: ExistingNodeSummary; score: number }[] = [];

  for (const ext of extracted) {
    for (const ex of existing) {
      const mappedType = mapExtractedType(ext.type);
      if (mappedType !== ex.type) continue;

      const score = similarity(ext.name, ex.name);
      if (score >= MATCH_THRESHOLD) {
        candidates.push({ extracted: ext, existing: ex, score });
      }
    }
  }

  // Sort by confidence descending (greedy best-first)
  candidates.sort((a, b) => b.score - a.score);

  const matchedExtracted = new Set<string>();
  const matchedExisting = new Set<string>();
  const matches: NodeMatch[] = [];

  for (const candidate of candidates) {
    const extKey = `${candidate.extracted.type}:${candidate.extracted.name}`;
    if (matchedExtracted.has(extKey) || matchedExisting.has(candidate.existing.id)) {
      continue;
    }

    matches.push({
      extractedName: candidate.extracted.name,
      existingNodeId: candidate.existing.id,
      confidence: candidate.score,
    });
    matchedExtracted.add(extKey);
    matchedExisting.add(candidate.existing.id);
  }

  const unmatched = extracted.filter((ext) => {
    const extKey = `${ext.type}:${ext.name}`;
    return !matchedExtracted.has(extKey);
  });

  return { matches, unmatched };
}
