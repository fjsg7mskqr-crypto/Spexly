import { describe, it, expect } from 'vitest'
import { generateContextFile } from './contextFileGenerator'
import type { SpexlyNode } from '@/types/nodes'

// ─── Fixtures ────────────────────────────────────────────

function makeIdeaNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'idea-1',
    type: 'idea',
    position: { x: 0, y: 0 },
    data: {
      appName: 'TestApp',
      description: 'A great app',
      targetUser: 'Developers',
      coreProblem: 'Lack of tooling',
      projectArchitecture: 'Monorepo with Next.js',
      corePatterns: ['Server Components', 'Server Actions'],
      constraints: ['Must be fast', 'GDPR compliant'],
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
      ...overrides,
    },
  } as SpexlyNode
}

function makeFeatureNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'feature-1',
    type: 'feature',
    position: { x: 0, y: 0 },
    data: {
      featureName: 'Auth',
      summary: '',
      problem: '',
      userStory: 'As a user I want to log in',
      acceptanceCriteria: ['Can log in', 'Can sign up'],
      implementationSteps: ['Create endpoint', 'Add middleware'],
      aiContext: 'Use bcrypt',
      codeReferences: ['src/auth.ts'],
      relatedFiles: ['src/middleware.ts'],
      testingRequirements: 'Integration tests',
      dependencies: ['DB setup'],
      technicalConstraints: 'Must use Postgres',
      priority: 'Must',
      status: 'Planned',
      effort: 'M',
      risks: '',
      metrics: '',
      notes: '',
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
      ...overrides,
    },
  } as SpexlyNode
}

function makeScreenNode(): SpexlyNode {
  return {
    id: 'screen-1',
    type: 'screen',
    position: { x: 0, y: 0 },
    data: {
      screenName: 'Dashboard',
      purpose: 'Main landing page',
      keyElements: ['Stats card'],
      componentHierarchy: ['DashboardPage', '  > StatsGrid'],
      userActions: [],
      states: [],
      navigation: '',
      dataSources: [],
      wireframeUrl: '',
      notes: '',
      aiContext: 'Use Tailwind grid',
      acceptanceCriteria: [],
      codeReferences: ['components/Dashboard.tsx'],
      testingRequirements: '',
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
    },
  } as SpexlyNode
}

function makeTechStackNode(toolName: string, category: string, version?: string): SpexlyNode {
  return {
    id: `tech-${toolName}`,
    type: 'techStack',
    position: { x: 0, y: 0 },
    data: {
      category,
      toolName,
      notes: '',
      version: version ?? '',
      rationale: 'Best in class',
      configurationNotes: 'Default config',
      integrationWith: [],
      tags: [],
      estimatedHours: null,
      expanded: false,
      completed: false,
    },
  } as SpexlyNode
}

// ─── Tests ───────────────────────────────────────────────

describe('generateContextFile', () => {
  it('includes Spexly header', () => {
    const output = generateContextFile([])
    expect(output).toContain('Spexly')
    expect(output).toContain('# Project Context')
  })

  it('includes architecture overview from idea node', () => {
    const output = generateContextFile([makeIdeaNode()])
    expect(output).toContain('Monorepo with Next.js')
    expect(output).toContain('A great app')
    expect(output).toContain('Developers')
    expect(output).toContain('Lack of tooling')
  })

  it('includes core patterns', () => {
    const output = generateContextFile([makeIdeaNode()])
    expect(output).toContain('Server Components')
    expect(output).toContain('Server Actions')
  })

  it('categorizes tech stack with version and rationale', () => {
    const nodes = [makeTechStackNode('Next.js', 'Frontend', '14.2')]
    const output = generateContextFile(nodes)
    expect(output).toContain('### Frontend')
    expect(output).toContain('**Next.js** (14.2)')
    expect(output).toContain('Best in class')
  })

  it('lists features with all context fields', () => {
    const output = generateContextFile([makeFeatureNode()])
    expect(output).toContain('### Auth')
    expect(output).toContain('As a user I want to log in')
    expect(output).toContain('Can log in')
    expect(output).toContain('1. Create endpoint')
    expect(output).toContain('Use bcrypt')
    expect(output).toContain('src/auth.ts')
    expect(output).toContain('`src/middleware.ts`')
  })

  it('lists screens with purpose, hierarchy, and elements', () => {
    const output = generateContextFile([makeScreenNode()])
    expect(output).toContain('### Dashboard')
    expect(output).toContain('Main landing page')
    expect(output).toContain('DashboardPage')
    expect(output).toContain('Stats card')
  })

  it('includes idea constraints', () => {
    const output = generateContextFile([makeIdeaNode()])
    expect(output).toContain('Must be fast')
    expect(output).toContain('GDPR compliant')
  })

  it('includes feature-specific constraints', () => {
    const output = generateContextFile([makeFeatureNode()])
    expect(output).toContain('Must use Postgres')
  })

  it('handles empty canvas without error', () => {
    const output = generateContextFile([])
    expect(typeof output).toBe('string')
    expect(output).toContain('Project Context')
  })
})
