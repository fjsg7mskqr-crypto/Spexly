import { type Node, type Edge } from '@xyflow/react';

// Node type discriminator
export type SpexlyNodeType = 'idea' | 'feature' | 'screen' | 'techStack' | 'prompt' | 'note';

// Feature-specific enums
export type FeaturePriority = 'Must' | 'Should' | 'Nice';
export type FeatureStatus = 'Planned' | 'In Progress' | 'Built' | 'Broken' | 'Blocked';
export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'Auth' | 'Hosting' | 'Other';
export type TargetTool = 'Claude' | 'Bolt' | 'Cursor' | 'Lovable' | 'Replit' | 'Other';

// Per-node data payloads (index signature required by React Flow's Record<string, unknown>)
export interface IdeaNodeData {
  [key: string]: unknown;
  appName: string;
  description: string;
  targetUser: string;
  coreProblem: string;
  expanded: boolean;
  completed: boolean;
}

export interface FeatureNodeData {
  [key: string]: unknown;
  featureName: string;
  description: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  expanded: boolean;
  completed: boolean;
}

export interface ScreenNodeData {
  [key: string]: unknown;
  screenName: string;
  description: string;
  keyElements: string;
  expanded: boolean;
  completed: boolean;
}

export interface TechStackNodeData {
  [key: string]: unknown;
  category: TechCategory;
  toolName: string;
  notes: string;
  expanded: boolean;
  completed: boolean;
}

export interface PromptNodeData {
  [key: string]: unknown;
  promptText: string;
  targetTool: TargetTool;
  resultNotes: string;
  expanded: boolean;
  completed: boolean;
}

export interface NoteNodeData {
  [key: string]: unknown;
  title: string;
  body: string;
  expanded: boolean;
  completed: boolean;
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
