import type {
  SpexlyNode,
  SpexlyEdge,
  IdeaNodeData,
  FeatureNodeData,
  ScreenNodeData,
  TechStackNodeData,
  PromptNodeData,
  TechCategory,
  TargetTool,
} from '@/types/nodes';

export interface GenerateCanvasInput {
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string[];
  screens: string[];
  tool: TargetTool;
  techStack?: { category: TechCategory; toolName: string; notes?: string }[];
  prompts?: { text: string; targetTool?: TargetTool }[];
}

export interface GenerateCanvasOutput {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

const COLUMN_X = [0, 360, 720, 1080, 1440];
const ROW_SPACING = 10;

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
  const techStack = (input.techStack ?? []).filter((item) => item.toolName.length > 0);
  const promptPack = (input.prompts ?? []).filter((item) => item.text.length > 0);
  const promptCount = promptPack.length > 0 ? promptPack.length : 1;

  const maxItems = Math.max(features.length, screens.length, techStack.length, promptCount, 1);
  const totalHeight = (maxItems - 1) * ROW_SPACING;

  const ts = Date.now();

  // Generate nodes
  const ideaPositions = centerPositions(1, COLUMN_X[0], totalHeight);
  const featurePositions = centerPositions(features.length, COLUMN_X[1], totalHeight);
  const screenPositions = centerPositions(screens.length, COLUMN_X[2], totalHeight);
  const techStackPositions = centerPositions(techStack.length, COLUMN_X[3], totalHeight);
  const promptPositions = centerPositions(promptCount, COLUMN_X[4], totalHeight);

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
      expanded: false,
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
      expanded: false,
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
      expanded: false,
      completed: false,
    } as ScreenNodeData,
  })) as SpexlyNode[];

  const techStackNodes: SpexlyNode[] = techStack.map((item, i) => ({
    id: `techStack-${ts}-${i}`,
    type: 'techStack' as const,
    position: techStackPositions[i],
    data: {
      category: item.category,
      toolName: item.toolName,
      notes: item.notes ?? '',
      expanded: false,
      completed: false,
    } as TechStackNodeData,
  })) as SpexlyNode[];

  const promptNodes: SpexlyNode[] =
    promptPack.length > 0
      ? promptPack.map((item, i) => ({
          id: `prompt-${ts}-${i}`,
          type: 'prompt' as const,
          position: promptPositions[i],
          data: {
            promptText: item.text,
            targetTool: item.targetTool ?? input.tool,
            resultNotes: '',
            expanded: false,
            completed: false,
          } as PromptNodeData,
        }))
      : [
          {
            id: `prompt-${ts}`,
            type: 'prompt' as const,
            position: promptPositions[0],
            data: {
            promptText: '',
            targetTool: input.tool,
            resultNotes: '',
            expanded: false,
            completed: false,
          } as PromptNodeData,
        },
        ];

  const nodes: SpexlyNode[] = [
    ideaNode,
    ...featureNodes,
    ...screenNodes,
    ...techStackNodes,
    ...promptNodes,
  ];

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

  // Idea → each Tech Stack
  for (const tsNode of techStackNodes) {
    edges.push({ id: `e-${ideaId}-${tsNode.id}`, source: ideaId, target: tsNode.id });
  }

  // Each Screen → first Prompt
  const firstPrompt = promptNodes[0];
  if (firstPrompt) {
    for (const sn of screenNodes) {
      edges.push({ id: `e-${sn.id}-${firstPrompt.id}`, source: sn.id, target: firstPrompt.id });
    }
  }

  // Chain prompt nodes to show build sequence
  if (promptNodes.length > 1) {
    for (let i = 0; i < promptNodes.length - 1; i++) {
      edges.push({
        id: `e-${promptNodes[i].id}-${promptNodes[i + 1].id}`,
        source: promptNodes[i].id,
        target: promptNodes[i + 1].id,
      });
    }
  }

  return { nodes, edges };
}
