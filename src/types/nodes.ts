import { type Node, type Edge } from '@xyflow/react';

// Node type discriminator
export type SpexlyNodeType = 'idea' | 'feature' | 'screen' | 'techStack' | 'prompt' | 'note';

// Feature-specific enums
export type FeaturePriority = 'Must' | 'Should' | 'Nice';
export type FeatureStatus = 'Planned' | 'In Progress' | 'Built' | 'Broken' | 'Blocked';
export type FeatureEffort = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'Auth' | 'Hosting' | 'Other';
export type TargetTool = 'Claude' | 'Bolt' | 'Cursor' | 'Lovable' | 'Replit' | 'Other';
export type NoteColorTag = 'Slate' | 'Amber' | 'Emerald' | 'Sky' | 'Rose';

// Per-node data payloads (index signature required by React Flow's Record<string, unknown>)
export interface IdeaNodeData {
  [key: string]: unknown;
  appName: string;
  description: string;
  targetUser: string;
  coreProblem: string;
  expanded: boolean;
  completed: boolean;
  // AI Context Fields
  projectArchitecture: string;
  corePatterns: string[];
  constraints: string[];
  // Metadata
  tags: string[];
  estimatedHours: number | null;
  version: number;
}

export interface FeatureNodeData {
  [key: string]: unknown;
  featureName: string;
  summary: string;
  problem: string;
  userStory: string;
  acceptanceCriteria: string[];
  priority: FeaturePriority;
  status: FeatureStatus;
  effort: FeatureEffort;
  dependencies: string[];
  risks: string;
  metrics: string;
  notes: string;
  expanded: boolean;
  completed: boolean;
  // AI Context Fields
  aiContext: string;
  implementationSteps: string[];
  codeReferences: string[];
  testingRequirements: string;
  relatedFiles: string[];
  technicalConstraints: string;
  // Metadata
  tags: string[];
  estimatedHours: number | null;
  version: number;
}

export interface ScreenNodeData {
  [key: string]: unknown;
  screenName: string;
  purpose: string;
  keyElements: string[];
  userActions: string[];
  states: string[];
  navigation: string;
  dataSources: string[];
  wireframeUrl: string;
  notes: string;
  expanded: boolean;
  completed: boolean;
  // AI Context Fields
  aiContext: string;
  acceptanceCriteria: string[];
  componentHierarchy: string[];
  codeReferences: string[];
  testingRequirements: string;
  // Metadata
  tags: string[];
  estimatedHours: number | null;
  version: number;
}

export interface TechStackNodeData {
  [key: string]: unknown;
  category: TechCategory;
  toolName: string;
  notes: string;
  expanded: boolean;
  completed: boolean;
  // AI Context Fields
  version: string;
  rationale: string;
  configurationNotes: string;
  integrationWith: string[];
  // Metadata
  tags: string[];
  estimatedHours: number | null;
}

export interface PromptNodeData {
  [key: string]: unknown;
  promptText: string;
  targetTool: TargetTool;
  resultNotes: string;
  expanded: boolean;
  completed: boolean;
  // AI Context Fields
  promptVersion: string;
  contextUsed: string[];
  actualOutput: string;
  refinements: string[];
  breakdown: string[];
  // Metadata
  tags: string[];
  estimatedHours: number | null;
}

export interface NoteNodeData {
  [key: string]: unknown;
  title: string;
  body: string;
  colorTag: NoteColorTag;
  expanded: boolean;
  completed: boolean;
  // Metadata
  tags: string[];
  estimatedHours: number | null;
}

// Union of all data types
export type SpexlyNodeData =
  | IdeaNodeData
  | FeatureNodeData
  | ScreenNodeData
  | TechStackNodeData
  | PromptNodeData
  | NoteNodeData;

// Typed node definitions for React Flow
export type IdeaNode = Node<IdeaNodeData, 'idea'>;
export type FeatureNode = Node<FeatureNodeData, 'feature'>;
export type ScreenNode = Node<ScreenNodeData, 'screen'>;
export type TechStackNode = Node<TechStackNodeData, 'techStack'>;
export type PromptNode = Node<PromptNodeData, 'prompt'>;
export type NoteNode = Node<NoteNodeData, 'note'>;

// App-wide union node type
export type SpexlyNode = IdeaNode | FeatureNode | ScreenNode | TechStackNode | PromptNode | NoteNode;

// Edge type
export type SpexlyEdge = Edge;

// History state for undo/redo
export interface HistoryEntry {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

// ─── Smart Import Types ─────────────────────────────────

/** Lightweight serializable summary of an existing canvas node */
export interface ExistingNodeSummary {
  id: string;
  type: SpexlyNodeType;
  name: string;
  populatedFields: string[];
}

/** Partial update to apply to an existing node */
export interface NodeFieldUpdate {
  nodeId: string;
  nodeType: SpexlyNodeType;
  fieldsToFill: Record<string, unknown>;
}

/** A match between an extracted item and an existing node */
export interface NodeMatch {
  extractedName: string;
  existingNodeId: string;
  confidence: number;
}

/** Statistics from a smart import operation */
export interface SmartImportSummary {
  nodesUpdated: number;
  fieldsFilledTotal: number;
  nodesCreated: number;
  nodesSkipped: number;
  matchDetails: NodeMatch[];
}

/** Full return type from smartImportDocument */
export interface SmartImportResult {
  updates: NodeFieldUpdate[];
  newNodes: SpexlyNode[];
  newEdges: SpexlyEdge[];
  summary: SmartImportSummary;
  mode: 'smart';
}
