import { describe, expect, it } from 'vitest';
import { normalizeFeatureList, normalizeScreenList, normalizeItemList } from './normalizeItemList';

describe('normalizeItemList', () => {
  it('parses plain text lists split by newline, comma, and semicolon', () => {
    const items = normalizeFeatureList('Auth, Dashboard\nSettings; Notifications');
    expect(items).toEqual(['Auth', 'Dashboard', 'Settings', 'Notifications']);
  });

  it('removes metadata/object-like lines', () => {
    const items = normalizeFeatureList(
      'Phase: Setup\nOwner: maintainer\nPlan Item ID: p2_t1\nlinked: techStack\nAuth'
    );
    expect(items).toEqual(['Auth']);
  });

  it('deduplicates case-insensitively', () => {
    const items = normalizeFeatureList('Auth, auth, AUTH, Dashboard');
    expect(items).toEqual(['Auth', 'Dashboard']);
  });

  it('parses JSON string arrays', () => {
    const items = normalizeFeatureList('["Auth", "Dashboard"]');
    expect(items).toEqual(['Auth', 'Dashboard']);
  });

  it('parses JSON object arrays using preferred keys', () => {
    const items = normalizeItemList(
      '[{"featureName":"Auth"},{"featureName":"Dashboard"},{"owner":"maintainer"}]',
      ['featureName']
    );
    expect(items).toEqual(['Auth', 'Dashboard']);
  });

  it('parses screen names from object arrays', () => {
    const items = normalizeScreenList('[{"screenName":"Login"},{"page":"Dashboard"}]');
    expect(items).toEqual(['Login', 'Dashboard']);
  });

  it('extracts concise feature titles from numbered lines with descriptions', () => {
    const items = normalizeFeatureList(
      [
        '1. Node-Based Canvas — 6 node types on a React Flow graph',
        '2. AI Document Import — Upload PDF/DOCX/TXT/MD',
        '3. Smart Import Merge: Re-import updates existing nodes',
      ].join('\n')
    );

    expect(items).toEqual(['Node-Based Canvas', 'AI Document Import', 'Smart Import Merge']);
  });

  it('extracts screen names from ascii table rows', () => {
    const items = normalizeScreenList(
      [
        '┌─────┬─────────────────────────┬─────────────────────┬────────────────────────┐',
        '│  #  │         Screen          │        Route        │        Purpose         │',
        '├─────┼─────────────────────────┼─────────────────────┼────────────────────────┤',
        '│ 1   │ Landing Page            │ /                   │ Marketing              │',
        '│ 2   │ Login                   │ /login              │ Authentication         │',
        '│ 3   │ Canvas Editor           │ /project/[id]       │ Workspace              │',
        '└─────┴─────────────────────────┴─────────────────────┴────────────────────────┘',
      ].join('\n')
    );

    expect(items).toEqual(['Landing Page', 'Login', 'Canvas Editor']);
  });
});
