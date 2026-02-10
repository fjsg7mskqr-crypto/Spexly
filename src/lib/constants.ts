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
  NoteColorTag,
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
      completed: false,
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
      completed: false,
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
      completed: false,
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
      completed: false,
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
      completed: false,
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
      colorTag: 'Slate' as const,
      expanded: true,
      completed: false,
    },
  },
};

export const NOTE_COLOR_OPTIONS: { value: NoteColorTag; label: string; swatch: string }[] = [
  { value: 'Slate', label: 'Slate', swatch: '#94A3B8' },
  { value: 'Amber', label: 'Amber', swatch: '#FBBF24' },
  { value: 'Emerald', label: 'Emerald', swatch: '#34D399' },
  { value: 'Sky', label: 'Sky', swatch: '#38BDF8' },
  { value: 'Rose', label: 'Rose', swatch: '#FB7185' },
];

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
