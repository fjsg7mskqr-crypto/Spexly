import { describe, it, expect } from 'vitest'
import { generateTodoMarkdown, generateGitHubIssues } from './todoMarkdownGenerator'
import type { SpexlyNode, FeatureStatus, FeaturePriority, FeatureEffort } from '@/types/nodes'

// ─── Fixtures ────────────────────────────────────────────

function makeIdeaNode(appName = 'TestApp'): SpexlyNode {
  return {
    id: 'idea-1',
    type: 'idea',
    position: { x: 0, y: 0 },
    data: {
      appName,
      description: 'A test project',
      targetUser: '',
      coreProblem: '',
      projectArchitecture: '',
      corePatterns: [],
      constraints: [],
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
    },
  } as SpexlyNode
}

function makeFeatureNode(
  name: string,
  status: FeatureStatus,
  opts: {
    priority?: FeaturePriority
    effort?: FeatureEffort
    summary?: string
    implementationSteps?: string[]
    risks?: string
    dependencies?: string[]
  } = {}
): SpexlyNode {
  return {
    id: `feature-${name}`,
    type: 'feature',
    position: { x: 0, y: 0 },
    data: {
      featureName: name,
      summary: opts.summary ?? '',
      problem: '',
      userStory: '',
      acceptanceCriteria: [],
      priority: opts.priority ?? 'Must',
      status,
      effort: opts.effort ?? 'M',
      dependencies: opts.dependencies ?? [],
      risks: opts.risks ?? '',
      metrics: '',
      notes: '',
      aiContext: '',
      implementationSteps: opts.implementationSteps ?? [],
      codeReferences: [],
      testingRequirements: '',
      relatedFiles: [],
      technicalConstraints: '',
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: false,
      completed: false,
    },
  } as SpexlyNode
}

// ─── generateTodoMarkdown ────────────────────────────────

describe('generateTodoMarkdown', () => {
  it('uses idea appName as title', () => {
    const nodes = [makeIdeaNode('MyApp')]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('# MyApp TODO')
  })

  it('falls back to "Project" when no idea node', () => {
    const nodes = [makeFeatureNode('Login', 'Planned')]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('# Project TODO')
  })

  it('groups features by status with correct sections', () => {
    const nodes = [
      makeFeatureNode('A', 'Planned'),
      makeFeatureNode('B', 'In Progress'),
      makeFeatureNode('C', 'Built'),
      makeFeatureNode('D', 'Blocked'),
      makeFeatureNode('E', 'Broken'),
    ]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('## Backlog')
    expect(output).toContain('## In Progress')
    expect(output).toContain('## Done')
    expect(output).toContain('## Blocked')
    expect(output).toContain('## Broken')
  })

  it('uses [x] checkmark for Built features', () => {
    const nodes = [makeFeatureNode('Done Feature', 'Built')]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('- [x] **Done Feature**')
  })

  it('uses [ ] for non-Built features', () => {
    const nodes = [makeFeatureNode('Todo Feature', 'Planned')]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('- [ ] **Todo Feature**')
  })

  it('includes priority and effort in Backlog items', () => {
    const nodes = [makeFeatureNode('F1', 'Planned', { priority: 'Should', effort: 'L' })]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('Should')
    expect(output).toContain('L')
  })

  it('includes implementation steps as sub-items', () => {
    const nodes = [
      makeFeatureNode('Login', 'Planned', {
        implementationSteps: ['Create form', 'Add validation'],
      }),
    ]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('- [ ] Create form')
    expect(output).toContain('- [ ] Add validation')
  })

  it('shows progress footer with correct percentage', () => {
    const nodes = [
      makeFeatureNode('A', 'Built'),
      makeFeatureNode('B', 'Built'),
      makeFeatureNode('C', 'Planned'),
      makeFeatureNode('D', 'Planned'),
    ]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('2/4 features (50%)')
  })

  it('handles 0 features without error', () => {
    const output = generateTodoMarkdown([])
    expect(output).toContain('0/0 features (0%)')
  })

  it('handles all features completed', () => {
    const nodes = [makeFeatureNode('A', 'Built')]
    const output = generateTodoMarkdown(nodes)
    expect(output).toContain('1/1 features (100%)')
  })
})

// ─── generateGitHubIssues ────────────────────────────────

describe('generateGitHubIssues', () => {
  it('creates one issue per feature', () => {
    const nodes = [
      makeFeatureNode('Login', 'Planned'),
      makeFeatureNode('Dashboard', 'Planned'),
    ]
    const issues = generateGitHubIssues(nodes)
    expect(issues).toHaveLength(2)
    expect(issues[0].title).toBe('Login')
    expect(issues[1].title).toBe('Dashboard')
  })

  it('maps "Must" priority to "priority: high" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { priority: 'Must' })])
    expect(issues[0].labels).toContain('priority: high')
  })

  it('maps "Should" priority to "priority: medium" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { priority: 'Should' })])
    expect(issues[0].labels).toContain('priority: medium')
  })

  it('maps "Nice" priority to "priority: low" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { priority: 'Nice' })])
    expect(issues[0].labels).toContain('priority: low')
  })

  it('maps XS/S effort to "effort: small" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { effort: 'S' })])
    expect(issues[0].labels).toContain('effort: small')
  })

  it('maps M effort to "effort: medium" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { effort: 'M' })])
    expect(issues[0].labels).toContain('effort: medium')
  })

  it('maps L/XL effort to "effort: large" label', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Planned', { effort: 'L' })])
    expect(issues[0].labels).toContain('effort: large')
  })

  it('adds "blocked" label for blocked features', () => {
    const issues = generateGitHubIssues([makeFeatureNode('F', 'Blocked')])
    expect(issues[0].labels).toContain('blocked')
  })

  it('ignores non-feature nodes', () => {
    const nodes: SpexlyNode[] = [makeIdeaNode(), makeFeatureNode('Auth', 'Planned')]
    const issues = generateGitHubIssues(nodes)
    expect(issues).toHaveLength(1)
  })
})
