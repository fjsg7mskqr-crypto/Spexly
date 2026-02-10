import type {
  SpexlyNode,
  SpexlyEdge,
  IdeaNodeData,
  FeatureNodeData,
  ScreenNodeData,
  PromptNodeData,
  TargetTool,
} from '@/types/nodes';

export interface GenerateCanvasInput {
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string[];
  screens: string[];
  tool: TargetTool;
}

export interface GenerateCanvasOutput {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

const COLUMN_X = [0, 400, 800, 1200];
const ROW_SPACING = 180;

function centerPositions(count: number, columnX: number, totalHeight: number): { x: number; y: number }[] {
  if (count === 0) return [];
  const columnHeight = (count - 1) * ROW_SPACING;
  const startY = (totalHeight - columnHeight) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: columnX,
    y: startY + i * ROW_SPACING,
  }));
}

export function generateCanvas(input: GenerateCanvasInput): GenerateCanvasOutput {
  const features = input.features.filter((f) => f.length > 0);
  const screens = input.screens.filter((s) => s.length > 0);

  const maxItems = Math.max(features.length, screens.length, 1);
  const totalHeight = (maxItems - 1) * ROW_SPACING;

  const ts = Date.now();

  // Generate nodes
  const ideaPositions = centerPositions(1, COLUMN_X[0], totalHeight);
  const featurePositions = centerPositions(features.length, COLUMN_X[1], totalHeight);
  const screenPositions = centerPositions(screens.length, COLUMN_X[2], totalHeight);
  const promptPositions = centerPositions(1, COLUMN_X[3], totalHeight);

  const ideaId = `idea-${ts}`;
  const ideaNode: SpexlyNode = {
    id: ideaId,
    type: 'idea',
    position: ideaPositions[0],
    data: {
      appName: '',
      description: input.description,
      targetUser: input.targetUser,
      coreProblem: input.coreProblem,
      expanded: true,
      completed: false,
    } as IdeaNodeData,
  } as SpexlyNode;

  const featureNodes: SpexlyNode[] = features.map((name, i) => ({
    id: `feature-${ts}-${i}`,
    type: 'feature' as const,
    position: featurePositions[i],
    data: {
      featureName: name,
      description: '',
      priority: 'Must' as const,
      status: 'Planned' as const,
      expanded: true,
      completed: false,
    } as FeatureNodeData,
  })) as SpexlyNode[];

  const screenNodes: SpexlyNode[] = screens.map((name, i) => ({
    id: `screen-${ts}-${i}`,
    type: 'screen' as const,
    position: screenPositions[i],
    data: {
      screenName: name,
      description: '',
      keyElements: '',
      expanded: true,
      completed: false,
    } as ScreenNodeData,
  })) as SpexlyNode[];

  const promptId = `prompt-${ts}`;
  const promptNode: SpexlyNode = {
    id: promptId,
    type: 'prompt',
    position: promptPositions[0],
    data: {
      promptText: '',
      targetTool: input.tool,
      resultNotes: '',
      expanded: true,
      completed: false,
    } as PromptNodeData,
  } as SpexlyNode;

  const nodes: SpexlyNode[] = [ideaNode, ...featureNodes, ...screenNodes, promptNode];

  // Generate edges
  const edges: SpexlyEdge[] = [];

  // Idea → each Feature
  for (const fn of featureNodes) {
    edges.push({ id: `e-${ideaId}-${fn.id}`, source: ideaId, target: fn.id });
  }

  // Feature[i] → Screen[i % screens.length]
  if (screens.length > 0) {
    for (let i = 0; i < featureNodes.length; i++) {
      const screenIdx = i % screenNodes.length;
      edges.push({
        id: `e-${featureNodes[i].id}-${screenNodes[screenIdx].id}`,
        source: featureNodes[i].id,
        target: screenNodes[screenIdx].id,
      });
    }
  }

  // Each Screen → Prompt
  for (const sn of screenNodes) {
    edges.push({ id: `e-${sn.id}-${promptId}`, source: sn.id, target: promptId });
  }

  return { nodes, edges };
}
