import { describe, it, expect } from 'vitest';
import { normalize, levenshtein, similarity, matchExtractedToExisting } from './fuzzyMatcher';
import type { ExistingNodeSummary } from '@/types/nodes';

describe('fuzzyMatcher', () => {
  describe('normalize', () => {
    it('lowercases input', () => {
      expect(normalize('User Authentication')).toBe('user authentication');
    });

    it('strips type suffixes', () => {
      expect(normalize('Login Screen')).toBe('login');
      expect(normalize('Auth Feature')).toBe('auth');
      expect(normalize('Dashboard Page')).toBe('dashboard');
    });

    it('removes punctuation', () => {
      expect(normalize('user-auth (v2)')).toBe('userauth v2');
    });

    it('collapses whitespace', () => {
      expect(normalize('  hello   world  ')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(normalize('')).toBe('');
    });
  });

  describe('levenshtein', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshtein('abc', 'abc')).toBe(0);
    });

    it('returns string length for empty vs non-empty', () => {
      expect(levenshtein('', 'abc')).toBe(3);
      expect(levenshtein('abc', '')).toBe(3);
    });

    it('computes correct distance for known pairs', () => {
      expect(levenshtein('kitten', 'sitting')).toBe(3);
      expect(levenshtein('saturday', 'sunday')).toBe(3);
    });

    it('handles single character difference', () => {
      expect(levenshtein('cat', 'bat')).toBe(1);
    });
  });

  describe('similarity', () => {
    it('returns 1 for exact match (after normalization)', () => {
      expect(similarity('Login', 'login')).toBe(1);
    });

    it('returns 1 for match after suffix stripping', () => {
      expect(similarity('Login Screen', 'Login')).toBe(1);
    });

    it('returns 0.85 for substring containment', () => {
      expect(similarity('User Authentication', 'Authentication')).toBe(0.85);
    });

    it('returns 0 for empty inputs', () => {
      expect(similarity('', 'hello')).toBe(0);
      expect(similarity('hello', '')).toBe(0);
    });

    it('returns high score for similar strings', () => {
      const score = similarity('Dashboard', 'Dashbord');
      expect(score).toBeGreaterThan(0.7);
    });

    it('returns low score for completely different strings', () => {
      const score = similarity('Authentication', 'Payment Processing');
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('matchExtractedToExisting', () => {
    const existing: ExistingNodeSummary[] = [
      { id: 'f1', type: 'feature', name: 'User Authentication', populatedFields: [] },
      { id: 'f2', type: 'feature', name: 'Dashboard', populatedFields: ['summary'] },
      { id: 's1', type: 'screen', name: 'Login Screen', populatedFields: [] },
      { id: 't1', type: 'techStack', name: 'React', populatedFields: [] },
    ];

    it('matches exact names', () => {
      const extracted = [
        { name: 'User Authentication', type: 'feature' as const },
      ];
      const { matches, unmatched } = matchExtractedToExisting(extracted, existing);
      expect(matches).toHaveLength(1);
      expect(matches[0].existingNodeId).toBe('f1');
      expect(matches[0].confidence).toBe(1);
      expect(unmatched).toHaveLength(0);
    });

    it('matches with substring containment', () => {
      const extracted = [
        { name: 'Authentication', type: 'feature' as const },
      ];
      const { matches } = matchExtractedToExisting(extracted, existing);
      expect(matches).toHaveLength(1);
      expect(matches[0].existingNodeId).toBe('f1');
      expect(matches[0].confidence).toBe(0.85);
    });

    it('only matches within same node type', () => {
      const extracted = [
        { name: 'Login', type: 'feature' as const },
      ];
      const { matches, unmatched } = matchExtractedToExisting(extracted, existing);
      // Should NOT match "Login Screen" since that's a screen node
      expect(matches).toHaveLength(0);
      expect(unmatched).toHaveLength(1);
    });

    it('puts unmatched items in the unmatched array', () => {
      const extracted = [
        { name: 'Payment Processing', type: 'feature' as const },
        { name: 'User Authentication', type: 'feature' as const },
      ];
      const { matches, unmatched } = matchExtractedToExisting(extracted, existing);
      expect(matches).toHaveLength(1);
      expect(unmatched).toHaveLength(1);
      expect(unmatched[0].name).toBe('Payment Processing');
    });

    it('does not double-match existing nodes', () => {
      const extracted = [
        { name: 'Authentication', type: 'feature' as const },
        { name: 'User Auth', type: 'feature' as const },
      ];
      const { matches, unmatched } = matchExtractedToExisting(extracted, existing);
      // Only one should match f1
      expect(matches).toHaveLength(1);
      expect(unmatched).toHaveLength(1);
    });

    it('handles empty extracted list', () => {
      const { matches, unmatched } = matchExtractedToExisting([], existing);
      expect(matches).toHaveLength(0);
      expect(unmatched).toHaveLength(0);
    });

    it('handles empty existing list', () => {
      const extracted = [{ name: 'Login', type: 'feature' as const }];
      const { matches, unmatched } = matchExtractedToExisting(extracted, []);
      expect(matches).toHaveLength(0);
      expect(unmatched).toHaveLength(1);
    });

    it('matches techStack nodes', () => {
      const extracted = [{ name: 'React', type: 'techStack' as const }];
      const { matches } = matchExtractedToExisting(extracted, existing);
      expect(matches).toHaveLength(1);
      expect(matches[0].existingNodeId).toBe('t1');
    });
  });
});
