import { describe, it, expect } from 'vitest';
import { isFieldEmpty, getPopulatedFields, buildFieldUpdate } from './mergeStrategy';

describe('mergeStrategy', () => {
  describe('isFieldEmpty', () => {
    it('returns true for empty string', () => {
      expect(isFieldEmpty('')).toBe(true);
    });

    it('returns true for null', () => {
      expect(isFieldEmpty(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isFieldEmpty(undefined)).toBe(true);
    });

    it('returns true for empty array', () => {
      expect(isFieldEmpty([])).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isFieldEmpty('hello')).toBe(false);
    });

    it('returns false for non-empty array', () => {
      expect(isFieldEmpty(['item'])).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isFieldEmpty(0)).toBe(false);
      expect(isFieldEmpty(42)).toBe(false);
    });

    it('returns false for booleans', () => {
      expect(isFieldEmpty(false)).toBe(false);
      expect(isFieldEmpty(true)).toBe(false);
    });
  });

  describe('getPopulatedFields', () => {
    it('returns only non-empty fields', () => {
      const data = {
        featureName: 'Auth',
        summary: '',
        problem: 'Need login',
        acceptanceCriteria: [],
        dependencies: ['Other feature'],
      };
      const result = getPopulatedFields(data);
      expect(result).toContain('featureName');
      expect(result).toContain('problem');
      expect(result).toContain('dependencies');
      expect(result).not.toContain('summary');
      expect(result).not.toContain('acceptanceCriteria');
    });

    it('returns empty array for all-empty data', () => {
      const data = { a: '', b: [], c: null };
      expect(getPopulatedFields(data)).toHaveLength(0);
    });

    it('includes boolean and number fields', () => {
      const data = { expanded: false, version: 1, name: '' };
      const result = getPopulatedFields(data);
      expect(result).toContain('expanded');
      expect(result).toContain('version');
      expect(result).not.toContain('name');
    });
  });

  describe('buildFieldUpdate', () => {
    it('fills empty fields with AI data', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        ['featureName', 'priority', 'status', 'effort', 'expanded', 'completed'],
        {
          featureName: 'Auth',
          summary: 'Handles user authentication',
          problem: 'Users need to log in',
          priority: 'Must',
          expanded: false,
        }
      );

      expect(result).not.toBeNull();
      expect(result!.nodeId).toBe('f1');
      expect(result!.fieldsToFill).toHaveProperty('summary', 'Handles user authentication');
      expect(result!.fieldsToFill).toHaveProperty('problem', 'Users need to log in');
    });

    it('does not overwrite populated fields', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        ['featureName', 'summary'],
        {
          featureName: 'AI Auth',
          summary: 'AI summary',
          problem: 'AI problem',
        }
      );

      expect(result).not.toBeNull();
      // summary is populated, so it should not be in fieldsToFill
      expect(result!.fieldsToFill).not.toHaveProperty('summary');
      expect(result!.fieldsToFill).toHaveProperty('problem', 'AI problem');
    });

    it('never overwrites protected fields', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        ['featureName'],
        {
          expanded: true,
          completed: true,
          version: 5,
          tags: ['tag1'],
          estimatedHours: 10,
          summary: 'Test',
        }
      );

      expect(result).not.toBeNull();
      expect(result!.fieldsToFill).not.toHaveProperty('expanded');
      expect(result!.fieldsToFill).not.toHaveProperty('completed');
      expect(result!.fieldsToFill).not.toHaveProperty('version');
      expect(result!.fieldsToFill).not.toHaveProperty('tags');
      expect(result!.fieldsToFill).not.toHaveProperty('estimatedHours');
      expect(result!.fieldsToFill).toHaveProperty('summary', 'Test');
    });

    it('never overwrites primary name fields', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        [],
        {
          featureName: 'AI Name',
          summary: 'Test',
        }
      );

      expect(result).not.toBeNull();
      expect(result!.fieldsToFill).not.toHaveProperty('featureName');
      expect(result!.fieldsToFill).toHaveProperty('summary', 'Test');
    });

    it('returns null when nothing to fill', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        ['featureName', 'summary', 'problem', 'userStory'],
        {
          featureName: 'Auth',
          summary: 'Test',
          problem: 'Test',
          userStory: 'Test',
        }
      );

      expect(result).toBeNull();
    });

    it('skips empty AI data values', () => {
      const result = buildFieldUpdate(
        'f1',
        'feature',
        ['featureName'],
        {
          summary: '',
          problem: '',
          acceptanceCriteria: [],
        }
      );

      expect(result).toBeNull();
    });

    it('works for screen nodes', () => {
      const result = buildFieldUpdate(
        's1',
        'screen',
        ['screenName'],
        {
          screenName: 'Login Screen',
          purpose: 'User authentication entry point',
          keyElements: ['Email input', 'Password input', 'Submit button'],
        }
      );

      expect(result).not.toBeNull();
      expect(result!.nodeType).toBe('screen');
      expect(result!.fieldsToFill).not.toHaveProperty('screenName');
      expect(result!.fieldsToFill).toHaveProperty('purpose');
      expect(result!.fieldsToFill).toHaveProperty('keyElements');
    });

    it('works for techStack nodes', () => {
      const result = buildFieldUpdate(
        't1',
        'techStack',
        ['toolName', 'category'],
        {
          toolName: 'React',
          rationale: 'Industry standard for building UIs',
          configurationNotes: 'Using Next.js App Router',
        }
      );

      expect(result).not.toBeNull();
      expect(result!.fieldsToFill).not.toHaveProperty('toolName');
      expect(result!.fieldsToFill).toHaveProperty('rationale');
      expect(result!.fieldsToFill).toHaveProperty('configurationNotes');
    });
  });
});
