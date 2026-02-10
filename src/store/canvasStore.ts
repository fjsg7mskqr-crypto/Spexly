'use client';

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type {
  SpexlyNode,
  SpexlyEdge,
  SpexlyNodeType,
  SpexlyNodeData,
  FeatureNodeData,
  FeatureStatus,
  HistoryEntry,
} from '@/types/nodes';
import { NODE_TYPE_CONFIGS, MAX_HISTORY } from '@/lib/constants';

interface CanvasState {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Project metadata
  projectId: string | null;
  projectName: string;
  isSaving: boolean;
  lastSavedAt: Date | null;

  onNodesChange: (changes: NodeChange<SpexlyNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<SpexlyEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: SpexlyNodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<SpexlyNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelected: () => void;
  toggleNodeExpanded: (nodeId: string) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  getProjectSummary: () => {
    totalNodes: number;
    byType: Record<SpexlyNodeType, number>;
    totalEdges: number;
  };

  getFeatureStatusCounts: () => Record<FeatureStatus, number>;
  setNodesAndEdges: (nodes: SpexlyNode[], edges: SpexlyEdge[]) => void;

  // Project lifecycle
  loadProject: (id: string, name: string, nodes: SpexlyNode[], edges: SpexlyEdge[]) => void;
  clearCanvas: () => void;
  setProjectMeta: (id: string, name: string) => void;
  setSaveStatus: (saving: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],

  projectId: null,
  projectName: '',
  isSaving: false,
  lastSavedAt: null,

  onNodesChange: (changes) => {
    const significantChange = changes.some(
      (c) => c.type === 'remove' || (c.type === 'position' && c.dragging === false)
    );
    if (significantChange) get().pushHistory();

    set({ nodes: applyNodeChanges(changes, get().nodes) as SpexlyNode[] });
  },

  onEdgesChange: (changes) => {
    const significantChange = changes.some((c) => c.type === 'remove');
    if (significantChange) get().pushHistory();

    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushHistory();
    set({ edges: addEdge(connection, get().edges) });
  },

  addNode: (type, position) => {
    get().pushHistory();
    const config = NODE_TYPE_CONFIGS[type];
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { ...config.defaultData },
    } as SpexlyNode;
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ) as SpexlyNode[],
    });
  },

  deleteNode: (nodeId) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  deleteSelected: () => {
    const { nodes, edges } = get();
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
    const hasSelection = selectedNodeIds.length > 0 || edges.some((e) => e.selected);
    if (!hasSelection) return;

    get().pushHistory();
    set({
      nodes: nodes.filter((n) => !n.selected),
      edges: edges.filter(
        (e) =>
          !e.selected &&
          !selectedNodeIds.includes(e.source) &&
          !selectedNodeIds.includes(e.target)
      ),
    });
  },

  toggleNodeExpanded: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, expanded: !node.data.expanded } }
          : node
      ) as SpexlyNode[],
    });
  },

  pushHistory: () => {
    const { nodes, edges, past } = get();
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      past: [...past.slice(-(MAX_HISTORY - 1)), entry],
      future: [],
    });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
        ...future,
      ],
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [
        ...past,
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      ],
    });
  },

  getProjectSummary: () => {
    const { nodes, edges } = get();
    const byType = {} as Record<SpexlyNodeType, number>;
    for (const node of nodes) {
      const t = node.type as SpexlyNodeType;
      byType[t] = (byType[t] || 0) + 1;
    }
    return { totalNodes: nodes.length, byType, totalEdges: edges.length };
  },

  getFeatureStatusCounts: () => {
    const { nodes } = get();
    const counts: Record<FeatureStatus, number> = {
      Planned: 0,
      'In Progress': 0,
      Built: 0,
      Broken: 0,
      Blocked: 0,
    };
    for (const node of nodes) {
      if (node.type === 'feature') {
        const status = (node.data as FeatureNodeData).status;
        counts[status] = (counts[status] || 0) + 1;
      }
    }
    return counts;
  },

  setNodesAndEdges: (nodes, edges) => {
    get().pushHistory();
    set({ nodes, edges });
  },

  loadProject: (id, name, nodes, edges) => {
    set({
      projectId: id,
      projectName: name,
      nodes,
      edges,
      past: [],
      future: [],
      isSaving: false,
      lastSavedAt: null,
    });
  },

  clearCanvas: () => {
    set({
      projectId: null,
      projectName: '',
      nodes: [],
      edges: [],
      past: [],
      future: [],
      isSaving: false,
      lastSavedAt: null,
    });
  },

  setProjectMeta: (id, name) => {
    set({ projectId: id, projectName: name });
  },

  setSaveStatus: (saving) => {
    set({
      isSaving: saving,
      ...(saving ? {} : { lastSavedAt: new Date() }),
    });
  },
}));
