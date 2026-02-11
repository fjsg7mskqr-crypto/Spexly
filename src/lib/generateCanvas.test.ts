import { describe, it, expect } from 'vitest';
import { generateCanvas, type GenerateCanvasInput } from './generateCanvas';

function makeInput(overrides?: Partial<GenerateCanvasInput>): GenerateCanvasInput {
  return {
    description: 'A todo app',
    targetUser: 'Developers',
    coreProblem: 'Staying organized',
    features: ['Auth', 'Dashboard', 'Settings'],
    screens: ['Login', 'Home', 'Settings'],
    tool: 'Claude',
    ...overrides,
  };
}

describe('generateCanvas', () => {
  it('generates correct number of nodes (1 idea + N features + M screens + 1 prompt)', () => {
    const result = generateCanvas(makeInput());
    // 1 idea + 3 features + 3 screens + 1 prompt = 8
    expect(result.nodes).toHaveLength(8);
  });

  it('generates idea node with correct data', () => {
    const result = generateCanvas(makeInput());
    const idea = result.nodes.find((n) => n.type === 'idea');
    expect(idea).toBeDefined();
    expect(idea!.data).toMatchObject({
      description: 'A todo app',
      targetUser: 'Developers',
      coreProblem: 'Staying organized',
      expanded: false,
    });
  });

  it('generates feature nodes with correct names', () => {
    const result = generateCanvas(makeInput());
    const features = result.nodes.filter((n) => n.type === 'feature');
    expect(features).toHaveLength(3);
    expect(features.map((f) => f.data.featureName)).toEqual(['Auth', 'Dashboard', 'Settings']);
  });

  it('generates screen nodes with correct names', () => {
    const result = generateCanvas(makeInput());
    const screens = result.nodes.filter((n) => n.type === 'screen');
    expect(screens).toHaveLength(3);
    expect(screens.map((s) => s.data.screenName)).toEqual(['Login', 'Home', 'Settings']);
  });

  it('generates prompt node with correct tool', () => {
    const result = generateCanvas(makeInput({ tool: 'Bolt' }));
    const prompt = result.nodes.find((n) => n.type === 'prompt');
    expect(prompt).toBeDefined();
    expect(prompt!.data.targetTool).toBe('Bolt');
  });

  it('creates edges from idea to each feature', () => {
    const result = generateCanvas(makeInput());
    const idea = result.nodes.find((n) => n.type === 'idea')!;
    const features = result.nodes.filter((n) => n.type === 'feature');
    const ideaEdges = result.edges.filter((e) => e.source === idea.id);
    expect(ideaEdges).toHaveLength(features.length);
    for (const fn of features) {
      expect(ideaEdges.some((e) => e.target === fn.id)).toBe(true);
    }
  });

  it('creates edges from features to screens', () => {
    const result = generateCanvas(makeInput());
    const features = result.nodes.filter((n) => n.type === 'feature');
    const screens = result.nodes.filter((n) => n.type === 'screen');
    for (const fn of features) {
      const outEdges = result.edges.filter((e) => e.source === fn.id);
      expect(outEdges).toHaveLength(1);
      expect(screens.some((s) => s.id === outEdges[0].target)).toBe(true);
    }
  });

  it('creates edges from each screen to prompt', () => {
    const result = generateCanvas(makeInput());
    const prompt = result.nodes.find((n) => n.type === 'prompt')!;
    const screens = result.nodes.filter((n) => n.type === 'screen');
    const promptEdges = result.edges.filter((e) => e.target === prompt.id);
    expect(promptEdges).toHaveLength(screens.length);
  });

  it('produces non-overlapping node positions', () => {
    const result = generateCanvas(makeInput());
    const positions = result.nodes.map((n) => `${n.position.x},${n.position.y}`);
    const unique = new Set(positions);
    expect(unique.size).toBe(positions.length);
  });

  it('all node IDs are unique', () => {
    const result = generateCanvas(makeInput());
    const ids = result.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all edge IDs are unique', () => {
    const result = generateCanvas(makeInput());
    const ids = result.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('handles zero features gracefully', () => {
    const result = generateCanvas(makeInput({ features: [] }));
    const features = result.nodes.filter((n) => n.type === 'feature');
    expect(features).toHaveLength(0);
    // Still has idea + screens + prompt
    expect(result.nodes).toHaveLength(5); // 1 + 0 + 3 + 1
  });

  it('handles zero screens gracefully', () => {
    const result = generateCanvas(makeInput({ screens: [] }));
    const screens = result.nodes.filter((n) => n.type === 'screen');
    expect(screens).toHaveLength(0);
    // No feature→screen edges, no screen→prompt edges
    const featureEdgesToScreen = result.edges.filter(
      (e) => e.source.startsWith('feature-') && e.target.startsWith('screen-')
    );
    expect(featureEdgesToScreen).toHaveLength(0);
  });

  it('handles single feature and single screen', () => {
    const result = generateCanvas(makeInput({ features: ['Auth'], screens: ['Login'] }));
    expect(result.nodes).toHaveLength(4); // 1 + 1 + 1 + 1
    expect(result.edges).toHaveLength(3); // idea→feature, feature→screen, screen→prompt
  });

  it('distributes features across screens when more features than screens', () => {
    const result = generateCanvas(makeInput({
      features: ['Auth', 'Dashboard', 'Settings', 'Profile'],
      screens: ['Login', 'Home'],
    }));
    const screens = result.nodes.filter((n) => n.type === 'screen');
    // Features 0,2 → Screen 0, Features 1,3 → Screen 1
    for (const screen of screens) {
      const incoming = result.edges.filter(
        (e) => e.target === screen.id && e.source.startsWith('feature-')
      );
      expect(incoming.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('filters out empty feature strings', () => {
    const result = generateCanvas(makeInput({ features: ['Auth', '', 'Settings', ''] }));
    const features = result.nodes.filter((n) => n.type === 'feature');
    expect(features).toHaveLength(2);
  });

  it('filters out empty screen strings', () => {
    const result = generateCanvas(makeInput({ screens: ['Login', '', ''] }));
    const screens = result.nodes.filter((n) => n.type === 'screen');
    expect(screens).toHaveLength(1);
  });

  it('sets all feature statuses to Planned', () => {
    const result = generateCanvas(makeInput());
    const features = result.nodes.filter((n) => n.type === 'feature');
    for (const f of features) {
      expect(f.data.status).toBe('Planned');
    }
  });

  it('adds tech stack nodes when provided', () => {
    const result = generateCanvas(makeInput({
      techStack: [
        { category: 'Frontend', toolName: 'Next.js', notes: 'App Router' },
        { category: 'Database', toolName: 'Supabase', notes: '' },
      ],
    }));
    const techNodes = result.nodes.filter((n) => n.type === 'techStack');
    expect(techNodes).toHaveLength(2);
    const idea = result.nodes.find((n) => n.type === 'idea')!;
    const ideaToTechEdges = result.edges.filter((e) => e.source === idea.id && e.target.startsWith('techStack-'));
    expect(ideaToTechEdges).toHaveLength(2);
  });

  it('creates multiple prompt nodes from prompt pack', () => {
    const result = generateCanvas(makeInput({
      prompts: [
        { text: 'Plan data models' },
        { text: 'Design UI flows' },
        { text: 'Implement auth screens' },
      ],
    }));
    const prompts = result.nodes.filter((n) => n.type === 'prompt');
    expect(prompts).toHaveLength(3);
    const promptEdges = result.edges.filter((e) => e.source.startsWith('prompt-') && e.target.startsWith('prompt-'));
    expect(promptEdges).toHaveLength(2);
  });
});
