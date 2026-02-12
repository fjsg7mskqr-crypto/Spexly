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
  FeaturePriority,
  FeatureStatus,
  FeatureEffort,
} from '@/types/nodes';

export interface GenerateCanvasInput {
  appName?: string;
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string[];
  screens: string[];
  tool: TargetTool;
  featuresDetailed?: {
    featureName: string;
    summary?: string;
    problem?: string;
    userStory?: string;
    acceptanceCriteria?: string[];
    priority?: FeaturePriority;
    status?: FeatureStatus;
    effort?: FeatureEffort;
    dependencies?: string[];
    risks?: string;
    metrics?: string;
    notes?: string;
  }[];
  screensDetailed?: {
    screenName: string;
    purpose?: string;
    keyElements?: string[];
    userActions?: string[];
    states?: string[];
    navigation?: string;
    dataSources?: string[];
    wireframeUrl?: string;
    notes?: string;
  }[];
  techStack?: { category: TechCategory; toolName: string; notes?: string }[];
  prompts?: { text: string; targetTool?: TargetTool }[];
  skipIdeaNode?: boolean;
}

export interface GenerateCanvasOutput {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

const COLUMN_X = [0, 360, 720, 1080, 1440];
const ROW_SPACING = 250;

const FEATURE_PRIORITIES = new Set<FeaturePriority>(['Must', 'Should', 'Nice']);
const FEATURE_STATUSES = new Set<FeatureStatus>(['Planned', 'In Progress', 'Built', 'Broken', 'Blocked']);
const FEATURE_EFFORTS = new Set<FeatureEffort>(['XS', 'S', 'M', 'L', 'XL']);

function normalizePriority(value?: FeaturePriority): FeaturePriority {
  return value && FEATURE_PRIORITIES.has(value) ? value : 'Must';
}

function normalizeStatus(value?: FeatureStatus): FeatureStatus {
  return value && FEATURE_STATUSES.has(value) ? value : 'Planned';
}

function normalizeEffort(value?: FeatureEffort): FeatureEffort {
  return value && FEATURE_EFFORTS.has(value) ? value : 'M';
}

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
  const promptCount = promptPack.length;
  const detailedFeatures = (input.featuresDetailed ?? []).filter((item) => item.featureName?.length > 0);
  const detailedScreens = (input.screensDetailed ?? []).filter((item) => item.screenName?.length > 0);

  const maxItems = Math.max(
    detailedFeatures.length || features.length,
    detailedScreens.length || screens.length,
    techStack.length,
    promptCount,
    1
  );
  const totalHeight = (maxItems - 1) * ROW_SPACING;

  const ts = Date.now();

  // Generate nodes
  const ideaPositions = centerPositions(1, COLUMN_X[0], totalHeight);
  const featurePositions = centerPositions(
    detailedFeatures.length || features.length,
    COLUMN_X[1],
    totalHeight
  );
  const screenPositions = centerPositions(
    detailedScreens.length || screens.length,
    COLUMN_X[2],
    totalHeight
  );
  const techStackPositions = centerPositions(techStack.length, COLUMN_X[3], totalHeight);
  const promptPositions = centerPositions(promptCount, COLUMN_X[4], totalHeight);

  const ideaId = `idea-${ts}`;
  const ideaNode: SpexlyNode = {
    id: ideaId,
    type: 'idea',
    position: ideaPositions[0],
    data: {
      appName: input.appName ?? '',
      description: input.description,
      targetUser: input.targetUser,
      coreProblem: input.coreProblem,
      expanded: false,
      completed: false,
      projectArchitecture: '',
      corePatterns: [],
      constraints: [],
      tags: [],
      estimatedHours: null,
      version: 1,
    } as IdeaNodeData,
  } as SpexlyNode;

  const featureSource: Array<{ featureName: string; [key: string]: any }> = detailedFeatures.length
    ? detailedFeatures
    : features.map((featureName) => ({ featureName }));

  const featureNodes: SpexlyNode[] = featureSource.map((item, i) => ({
    id: `feature-${ts}-${i}`,
    type: 'feature' as const,
    position: featurePositions[i],
    data: {
      featureName: item.featureName,
      summary: item.summary ?? '',
      problem: item.problem ?? '',
      userStory: item.userStory ?? '',
      acceptanceCriteria: item.acceptanceCriteria ?? [],
      priority: normalizePriority(item.priority),
      status: normalizeStatus(item.status),
      effort: normalizeEffort(item.effort),
      dependencies: item.dependencies ?? [],
      risks: item.risks ?? '',
      metrics: item.metrics ?? '',
      notes: item.notes ?? '',
      expanded: false,
      completed: false,
      aiContext: '',
      implementationSteps: [],
      codeReferences: [],
      testingRequirements: '',
      relatedFiles: [],
      technicalConstraints: '',
      tags: [],
      estimatedHours: null,
      version: 1,
    } as FeatureNodeData,
  })) as SpexlyNode[];

  const screenSource: Array<{ screenName: string; [key: string]: any }> = detailedScreens.length
    ? detailedScreens
    : screens.map((screenName) => ({ screenName }));

  const screenNodes: SpexlyNode[] = screenSource.map((item, i) => ({
    id: `screen-${ts}-${i}`,
    type: 'screen' as const,
    position: screenPositions[i],
    data: {
      screenName: item.screenName,
      purpose: item.purpose ?? '',
      keyElements: item.keyElements ?? [],
      userActions: item.userActions ?? [],
      states: item.states ?? [],
      navigation: item.navigation ?? '',
      dataSources: item.dataSources ?? [],
      wireframeUrl: item.wireframeUrl ?? '',
      notes: item.notes ?? '',
      expanded: false,
      completed: false,
      aiContext: '',
      acceptanceCriteria: [],
      componentHierarchy: [],
      codeReferences: [],
      testingRequirements: '',
      tags: [],
      estimatedHours: null,
      version: 1,
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
      version: '',
      rationale: '',
      configurationNotes: '',
      integrationWith: [],
      tags: [],
      estimatedHours: null,
    } as TechStackNodeData,
  })) as SpexlyNode[];

  const promptNodes: SpexlyNode[] = promptPack.map((item, i) => ({
    id: `prompt-${ts}-${i}`,
    type: 'prompt' as const,
    position: promptPositions[i],
    data: {
      promptText: item.text,
      targetTool: item.targetTool ?? input.tool,
      resultNotes: '',
      expanded: false,
      completed: false,
      promptVersion: '',
      contextUsed: [],
      actualOutput: '',
      refinements: [],
      tags: [],
      estimatedHours: null,
    } as PromptNodeData,
  }));

  const nodes: SpexlyNode[] = [
    ...(input.skipIdeaNode ? [] : [ideaNode]),
    ...featureNodes,
    ...screenNodes,
    ...techStackNodes,
    ...promptNodes,
  ];

  // Generate edges
  const edges: SpexlyEdge[] = [];

  if (!input.skipIdeaNode) {
    // Idea → each Feature
    for (const fn of featureNodes) {
      edges.push({ id: `e-${ideaId}-${fn.id}`, source: ideaId, target: fn.id });
    }

    // Idea → each Tech Stack
    for (const tsNode of techStackNodes) {
      edges.push({ id: `e-${ideaId}-${tsNode.id}`, source: ideaId, target: tsNode.id });
    }
  }

  // Feature[i] → Screen[i % screens.length]
  if (screenNodes.length > 0) {
    for (let i = 0; i < featureNodes.length; i++) {
      const screenIdx = i % screenNodes.length;
      edges.push({
        id: `e-${featureNodes[i].id}-${screenNodes[screenIdx].id}`,
        source: featureNodes[i].id,
        target: screenNodes[screenIdx].id,
      });
    }
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
