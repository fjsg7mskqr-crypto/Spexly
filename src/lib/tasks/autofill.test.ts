import { describe, expect, it } from 'vitest';
import { buildNodeAutofillUpdate } from './autofill';
import { NODE_TYPE_CONFIGS } from '@/lib/constants';
import type { SpexlyNode } from '@/types/nodes';

function makeNode(type: SpexlyNode['type'], data: Record<string, unknown>): SpexlyNode {
  return {
    id: `${type}-1`,
    type,
    position: { x: 0, y: 0 },
    data: { ...(NODE_TYPE_CONFIGS[type].defaultData as Record<string, unknown>), ...data },
  } as SpexlyNode;
}

describe('buildNodeAutofillUpdate', () => {
  it('fills empty feature fields and appends implementation steps', () => {
    const node = makeNode('feature', { featureName: '', summary: '', implementationSteps: [], notes: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Feature: Authentication',
      details: '- Add signup\n- Add login',
    });

    expect(update.featureName).toBe('Authentication');
    expect(update.summary).toBeUndefined();
    expect(update.implementationSteps).toEqual(['Add signup', 'Add login']);
    expect(String(update.notes)).toContain('Task: Authentication');
  });

  it('maps structured feature sections into existing feature fields', () => {
    const node = makeNode('feature', {
      featureName: 'Auth',
      summary: '',
      problem: '',
      userStory: '',
      acceptanceCriteria: [],
      dependencies: [],
      risks: '',
      metrics: '',
      aiContext: '',
      codeReferences: [],
      testingRequirements: '',
      relatedFiles: [],
      technicalConstraints: '',
      notes: '',
    });

    const update = buildNodeAutofillUpdate(node, {
      title: 'Feature: Authentication',
      details: [
        'Summary: Secure sign-in and account creation flow.',
        'Problem: Users need private project access.',
        'User Story: As a user, I want to log in securely.',
        'Acceptance Criteria:',
        '- Users can sign up with email and password',
        '- Users can log in with valid credentials',
        'Dependencies:',
        '- User table migration',
        'AI Context: Use Next.js server actions and Supabase auth.',
        'Code References:',
        '- /app/login/page.tsx',
        'Testing Requirements: Cover happy path and auth failures.',
      ].join('\n'),
    });

    expect(update.summary).toContain('Secure sign-in');
    expect(update.problem).toContain('private project access');
    expect(update.userStory).toContain('log in securely');
    expect(update.acceptanceCriteria).toEqual([
      'Users can sign up with email and password',
      'Users can log in with valid credentials',
    ]);
    expect(update.dependencies).toEqual(['User table migration']);
    expect(update.aiContext).toContain('server actions');
    expect(update.codeReferences).toEqual(['/app/login/page.tsx']);
    expect(update.testingRequirements).toContain('happy path');
  });

  it('fills screen purpose when empty', () => {
    const node = makeNode('screen', { screenName: 'Dashboard', purpose: '', notes: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Screen: Dashboard',
      details: 'Main analytics and KPI summary screen.',
    });

    expect(update.purpose).toBeUndefined();
  });

  it('fills tech stack tool name when empty', () => {
    const node = makeNode('techStack', { toolName: '', notes: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Tech Stack: Supabase',
      details: 'Use Supabase auth and database.',
    });

    expect(update.toolName).toBe('Supabase');
    expect(String(update.notes)).toContain('Task: Supabase');
  });

  it('sets idea core problem when empty', () => {
    const node = makeNode('idea', { coreProblem: '', description: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Improve onboarding',
      details: 'Users drop off before activating their account.',
    });

    expect(update.coreProblem).toBe('Users drop off before activating their account.');
  });

  it('never returns ad-hoc fields that are not part of node schema', () => {
    const node = makeNode('screen', { screenName: '', purpose: '', notes: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Screen: Dashboard',
      details: 'Context: Should not create a raw "context" key',
    });

    expect(Object.prototype.hasOwnProperty.call(update, 'context')).toBe(false);
  });

  it('does not copy the same unstructured blob into multiple fields', () => {
    const details = 'Random paragraph without section headings.\nAnother line.';
    const node = makeNode('feature', {
      featureName: '',
      summary: '',
      notes: '',
      implementationSteps: [],
      acceptanceCriteria: [],
    });

    const update = buildNodeAutofillUpdate(node, {
      title: 'Feature: Parser hardening',
      details,
    });

    expect(update.summary).toBeUndefined();
    expect(update.implementationSteps).toEqual([
      'Random paragraph without section headings.',
      'Another line.',
    ]);
    expect(update.notes).toBe('Task: Parser hardening');
  });
});
