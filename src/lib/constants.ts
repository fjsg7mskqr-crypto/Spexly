import {
  Lightbulb,
  Layers,
  Monitor,
  Server,
  MessageSquare,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import type {
  SpexlyNodeType,
  IdeaNodeData,
  FeatureNodeData,
  ScreenNodeData,
  TechStackNodeData,
  PromptNodeData,
  NoteNodeData,
  FeatureStatus,
} from '@/types/nodes';

export interface NodeTypeConfig {
  type: SpexlyNodeType;
  label: string;
  color: string;
  icon: LucideIcon;
  defaultData:
    | IdeaNodeData
    | FeatureNodeData
    | ScreenNodeData
    | TechStackNodeData
    | PromptNodeData
    | NoteNodeData;
}

export const NODE_TYPE_CONFIGS: Record<SpexlyNodeType, NodeTypeConfig> = {
  idea: {
    type: 'idea',
    label: 'Idea',
    color: '#A78BFA',
    icon: Lightbulb,
    defaultData: {
      appName: '',
      description: '',
      targetUser: '',
      coreProblem: '',
      expanded: true,
    },
  },
  feature: {
    type: 'feature',
    label: 'Feature',
    color: '#60A5FA',
    icon: Layers,
    defaultData: {
      featureName: '',
      description: '',
      priority: 'Must' as const,
      status: 'Planned' as const,
      expanded: true,
    },
  },
  screen: {
    type: 'screen',
    label: 'Screen',
    color: '#34D399',
    icon: Monitor,
    defaultData: {
      screenName: '',
      description: '',
      keyElements: '',
      expanded: true,
    },
  },
  techStack: {
    type: 'techStack',
    label: 'Tech Stack',
    color: '#FBBF24',
    icon: Server,
    defaultData: {
      category: 'Frontend' as const,
      toolName: '',
      notes: '',
      expanded: true,
    },
  },
  prompt: {
    type: 'prompt',
    label: 'Prompt',
    color: '#F472B6',
    icon: MessageSquare,
    defaultData: {
      promptText: '',
      targetTool: 'Claude' as const,
      resultNotes: '',
      expanded: true,
    },
  },
  note: {
    type: 'note',
    label: 'Note',
    color: '#94A3B8',
    icon: StickyNote,
    defaultData: {
      title: '',
      body: '',
      expanded: true,
    },
  },
};

// Feature status badge configuration
export const FEATURE_STATUS_CONFIG: Record<
  FeatureStatus,
  {
    color: string;
    bgColor: string;
    icon: 'circle' | 'loader' | 'check' | 'alert-triangle' | 'lock';
    pulse?: boolean;
  }
> = {
  Planned: { color: '#CBD5E1', bgColor: 'rgba(71,85,105,0.5)', icon: 'circle' },
  'In Progress': { color: '#60A5FA', bgColor: 'rgba(59,130,246,0.2)', icon: 'loader', pulse: true },
  Built: { color: '#34D399', bgColor: 'rgba(52,211,153,0.2)', icon: 'check' },
  Broken: { color: '#F87171', bgColor: 'rgba(248,113,113,0.2)', icon: 'alert-triangle' },
  Blocked: { color: '#FBBF24', bgColor: 'rgba(251,191,36,0.2)', icon: 'lock' },
};

// Canvas constants
export const GRID_SNAP: [number, number] = [15, 15];
export const CANVAS_BG_COLOR = '#0F172A';
export const CANVAS_DOT_COLOR = '#1E293B';
export const NODE_BG_COLOR = '#1E293B';
export const EDGE_COLOR = '#334155';
export const MAX_HISTORY = 20;
