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
    expect(update.summary).toContain('Add signup');
    expect(update.implementationSteps).toEqual(['Add signup', 'Add login']);
    expect(String(update.notes)).toContain('Task: Authentication');
  });

  it('fills screen purpose when empty', () => {
    const node = makeNode('screen', { screenName: 'Dashboard', purpose: '', notes: '' });
    const update = buildNodeAutofillUpdate(node, {
      title: 'Screen: Dashboard',
      details: 'Main analytics and KPI summary screen.',
    });

    expect(update.purpose).toBe('Main analytics and KPI summary screen.');
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
});
