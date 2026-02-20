import { describe, it, expect } from 'vitest'
import { generateFeaturePrompt, generateCursorPlanPrompt, generateFullStackPrompt } from './promptGenerator'
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes'

// ─── Fixtures ────────────────────────────────────────────

function makeFeatureNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'feature-1',
    type: 'feature',
    position: { x: 0, y: 0 },
    data: {
      featureName: 'Auth Flow',
      summary: 'User authentication',
      problem: 'No secure login',
      userStory: 'As a user I want to log in',
      acceptanceCriteria: ['Can sign up', 'Can log in'],
      implementationSteps: ['Create endpoint', 'Add JWT'],
      aiContext: 'Use bcrypt for hashing',
      codeReferences: ['src/api/auth.ts'],
      relatedFiles: ['src/lib/jwt.ts', 'src/middleware/auth.ts'],
      testingRequirements: 'Unit tests for auth endpoints',
      dependencies: ['Database setup'],
      technicalConstraints: 'Must use PostgreSQL',
      priority: 'Must',
      status: 'Planned',
      effort: 'L',
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

function makeTechStackNode(toolName: string, version?: string): SpexlyNode {
  return {
    id: `tech-${toolName}`,
    type: 'techStack',
    position: { x: 0, y: 0 },
    data: {
      category: 'Frontend',
      toolName,
      notes: '',
      version: version || '',
      rationale: '',
      configurationNotes: '',
      integrationWith: [],
      tags: [],
      estimatedHours: null,
      expanded: false,
      completed: false,
    },
  } as SpexlyNode
}

function makeIdeaNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'idea-1',
    type: 'idea',
    position: { x: 0, y: 0 },
    data: {
      appName: 'TestApp',
      description: 'A test application',
      targetUser: 'Developers',
      coreProblem: 'Lack of tooling',
      projectArchitecture: '',
      corePatterns: [],
      constraints: ['Must be fast', 'Must be secure'],
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
      ...overrides,
    },
  } as SpexlyNode
}

function makeScreenNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'screen-1',
    type: 'screen',
    position: { x: 0, y: 0 },
    data: {
      screenName: 'Dashboard',
      purpose: 'Main overview page',
      keyElements: ['Stats card', 'Chart'],
      userActions: [],
      states: [],
      navigation: '',
      dataSources: [],
      wireframeUrl: '',
      notes: '',
      aiContext: '',
      acceptanceCriteria: [],
      componentHierarchy: [],
      codeReferences: [],
      testingRequirements: '',
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
      ...overrides,
    },
  } as SpexlyNode
}

function makePromptNode(overrides: Record<string, unknown> = {}): SpexlyNode {
  return {
    id: 'prompt-1',
    type: 'prompt',
    position: { x: 0, y: 0 },
    data: {
      promptText: 'Build Auth Flow with secure sessions',
      targetTool: 'Claude',
      resultNotes: 'Using server actions avoided client-side auth bugs',
      expanded: false,
      completed: false,
      promptVersion: 'v1',
      contextUsed: ['Auth Flow', 'User authentication'],
      actualOutput: 'Generated route handlers and middleware',
      refinements: ['Add RLS policy validation'],
      breakdown: ['Create auth endpoint', 'Add password hashing'],
      tags: [],
      estimatedHours: null,
      ...overrides,
    },
  } as SpexlyNode
}

// ─── generateFeaturePrompt ───────────────────────────────

describe('generateFeaturePrompt', () => {
  it('throws for non-feature nodes', () => {
    const idea = makeIdeaNode()
    expect(() => generateFeaturePrompt(idea, [])).toThrow(/feature/i)
  })

  it('includes feature name in header', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Auth Flow')
  })

  it('includes summary and problem', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('User authentication')
    expect(output).toContain('No secure login')
  })

  it('includes user story', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('As a user I want to log in')
  })

  it('includes acceptance criteria as checklist items', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('- [ ] Can sign up')
    expect(output).toContain('- [ ] Can log in')
  })

  it('includes numbered implementation steps', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('1. Create endpoint')
    expect(output).toContain('2. Add JWT')
  })

  it('includes AI context section', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Use bcrypt for hashing')
  })

  it('includes code references', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('src/api/auth.ts')
  })

  it('wraps related files in backticks', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('`src/lib/jwt.ts`')
  })

  it('includes testing requirements', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Unit tests for auth endpoints')
  })

  it('includes dependencies', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Database setup')
  })

  it('includes technical constraints', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Must use PostgreSQL')
  })

  it('includes tech stack from allNodes', () => {
    const tech = makeTechStackNode('Next.js', '14')
    const output = generateFeaturePrompt(makeFeatureNode(), [tech])
    expect(output).toContain('Next.js')
    expect(output).toContain('14')
  })

  it('includes Spexly footer', () => {
    const output = generateFeaturePrompt(makeFeatureNode(), [])
    expect(output).toContain('Spexly')
  })

  it('includes feature planning metadata', () => {
    const output = generateFeaturePrompt(makeFeatureNode({
      risks: 'Token refresh edge cases',
      metrics: '95% successful login rate',
      notes: 'Coordinate with onboarding feature',
      tags: ['auth', 'security'],
      estimatedHours: 12,
    }), [])
    expect(output).toContain('## Feature Metadata')
    expect(output).toContain('Priority: Must')
    expect(output).toContain('Estimated Hours: 12')
    expect(output).toContain('Token refresh edge cases')
    expect(output).toContain('95% successful login rate')
    expect(output).toContain('auth, security')
  })

  it('includes connected context and prompt learnings when related by edges', () => {
    const feature = makeFeatureNode()
    const screen = makeScreenNode()
    const prompt = makePromptNode()
    const edges: SpexlyEdge[] = [
      { id: 'e-feature-screen', source: feature.id, target: screen.id },
      { id: 'e-feature-prompt', source: feature.id, target: prompt.id },
    ]
    const output = generateFeaturePrompt(feature, [feature, screen, prompt], edges)

    expect(output).toContain('## Connected Canvas Context')
    expect(output).toContain('screen: Dashboard')
    expect(output).toContain('## Prompt Learnings')
    expect(output).toContain('Prompt 1 (Claude)')
    expect(output).toContain('Using server actions avoided client-side auth bugs')
    expect(output).toContain('Create auth endpoint')
  })
})

// ─── generateCursorPlanPrompt ────────────────────────────

describe('generateCursorPlanPrompt', () => {
  it('throws for non-feature nodes', () => {
    expect(() => generateCursorPlanPrompt(makeIdeaNode(), [])).toThrow(/feature/i)
  })

  it('deduplicates relatedFiles and codeReferences', () => {
    const node = makeFeatureNode({
      relatedFiles: ['shared.ts', 'unique-file.ts'],
      codeReferences: ['shared.ts', 'unique-ref.ts'],
    })
    const output = generateCursorPlanPrompt(node, [])
    // All files should appear
    expect(output).toContain('shared.ts')
    expect(output).toContain('unique-file.ts')
    expect(output).toContain('unique-ref.ts')
    // shared.ts should only appear once in the File Structure section
    const fileSection = output.split('## File Structure')[1]?.split('##')[0] ?? ''
    const matches = fileSection.match(/shared\.ts/g)
    expect(matches).toHaveLength(1)
  })

  it('includes implementation steps as checklist', () => {
    const output = generateCursorPlanPrompt(makeFeatureNode(), [])
    expect(output).toContain('- [ ] Create endpoint')
    expect(output).toContain('- [ ] Add JWT')
  })

  it('includes dependencies', () => {
    const output = generateCursorPlanPrompt(makeFeatureNode(), [])
    expect(output).toContain('Database setup')
  })

  it('includes planning metadata and prompt learnings', () => {
    const feature = makeFeatureNode({ metrics: 'Login completion > 90%' })
    const prompt = makePromptNode({ targetTool: 'Cursor' })
    const edges: SpexlyEdge[] = [{ id: 'e-feature-prompt', source: feature.id, target: prompt.id }]
    const output = generateCursorPlanPrompt(feature, [feature, prompt], edges)

    expect(output).toContain('## Planning Metadata')
    expect(output).toContain('Priority: Must')
    expect(output).toContain('## Prompt Learnings')
    expect(output).toContain('Cursor:')
    expect(output).toContain('## Connected Canvas Context')
  })
})

// ─── generateFullStackPrompt ─────────────────────────────

describe('generateFullStackPrompt', () => {
  it('includes idea node data', () => {
    const nodes = [makeIdeaNode()]
    const output = generateFullStackPrompt(nodes)
    expect(output).toContain('TestApp')
    expect(output).toContain('A test application')
    expect(output).toContain('Developers')
    expect(output).toContain('Lack of tooling')
  })

  it('includes features with acceptance criteria', () => {
    const nodes = [makeFeatureNode()]
    const output = generateFullStackPrompt(nodes)
    expect(output).toContain('Auth Flow')
    expect(output).toContain('Can sign up')
  })

  it('includes screens with key elements', () => {
    const nodes = [makeScreenNode()]
    const output = generateFullStackPrompt(nodes)
    expect(output).toContain('Dashboard')
    expect(output).toContain('Stats card')
  })

  it('categorizes tech stack', () => {
    const nodes = [makeTechStackNode('React')]
    const output = generateFullStackPrompt(nodes)
    expect(output).toContain('Frontend')
    expect(output).toContain('React')
  })

  it('includes constraints from idea node', () => {
    const nodes = [makeIdeaNode()]
    const output = generateFullStackPrompt(nodes)
    expect(output).toContain('Must be fast')
    expect(output).toContain('Must be secure')
  })

  it('handles empty node array', () => {
    const output = generateFullStackPrompt([])
    expect(typeof output).toBe('string')
  })
})
