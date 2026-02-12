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
  NodeFieldUpdate,
} from '@/types/nodes';
import { NODE_TYPE_CONFIGS, MAX_HISTORY } from '@/lib/constants';

interface CanvasState {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  baselineNodes: SpexlyNode[];
  baselineEdges: SpexlyEdge[];
  nodeHeights: Record<string, number>;
  expandShiftMap: Record<string, { affectedIds: string[]; delta: number }>;

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
  toggleNodeCompleted: (nodeId: string) => void;

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
  appendNodesAndEdges: (nodes: SpexlyNode[], edges: SpexlyEdge[]) => void;
  resetLayout: () => void;
  setNodeHeight: (nodeId: string, height: number) => void;

  smartImport: (updates: NodeFieldUpdate[], newNodes: SpexlyNode[], newEdges: SpexlyEdge[]) => void;

  // Project lifecycle
  loadProject: (id: string, name: string, nodes: SpexlyNode[], edges: SpexlyEdge[]) => void;
  clearCanvas: () => void;
  setProjectMeta: (id: string, name: string) => void;
  setSaveStatus: (saving: boolean) => void;
}

const BASE_VERTICAL_GAP = 0;
const EXPANDED_VERTICAL_GAP = 220;
const COLUMN_X = [0, 360, 720, 1080, 1440, 1800];
const ROW_SPACING = 250;
const NODE_WIDTH = 320;
const NODE_GAP = 10;

function getNodeHeight(node: SpexlyNode, heightMap?: Record<string, number>): number {
  if (heightMap && heightMap[node.id]) {
    return heightMap[node.id];
  }
  const expanded = Boolean(node.data?.expanded);
  if (node.type === 'prompt' || node.type === 'note') {
    return expanded ? 560 : 240;
  }
  if (node.type === 'idea' || node.type === 'feature' || node.type === 'screen') {
    return expanded ? 520 : 220;
  }
  if (node.type === 'techStack') {
    return expanded ? 480 : 200;
  }
  return expanded ? 520 : 220;
}

function nodesOverlap(
  a: SpexlyNode,
  b: SpexlyNode,
  heightMap?: Record<string, number>
): boolean {
  const aWidth = NODE_WIDTH;
  const bWidth = NODE_WIDTH;
  const aHeight = getNodeHeight(a, heightMap);
  const bHeight = getNodeHeight(b, heightMap);

  const ax1 = a.position.x - NODE_GAP / 2;
  const ay1 = a.position.y - NODE_GAP / 2;
  const ax2 = a.position.x + aWidth + NODE_GAP / 2;
  const ay2 = a.position.y + aHeight + NODE_GAP / 2;

  const bx1 = b.position.x - NODE_GAP / 2;
  const by1 = b.position.y - NODE_GAP / 2;
  const bx2 = b.position.x + bWidth + NODE_GAP / 2;
  const by2 = b.position.y + bHeight + NODE_GAP / 2;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function resolveOverlap(
  nodes: SpexlyNode[],
  movedId: string,
  targetPosition?: { x: number; y: number },
  heightMap?: Record<string, number>
): SpexlyNode[] {
  const moved = nodes.find((n) => n.id === movedId);
  if (!moved) return nodes;

  const base = targetPosition ?? moved.position;
  const stepX = 60;
  const stepY = 60;
  const maxRadius = 6;

  const isFree = (pos: { x: number; y: number }) => {
    const probe = { ...moved, position: pos };
    return !nodes.some((n) => n.id !== moved.id && nodesOverlap(probe, n, heightMap));
  };

  if (isFree(base)) {
    moved.position = base;
    return nodes;
  }

  let best: { x: number; y: number } | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const candidate = { x: base.x + dx * stepX, y: base.y + dy * stepY };
        if (!isFree(candidate)) continue;
        const dist = Math.hypot(candidate.x - base.x, candidate.y - base.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = candidate;
        }
      }
    }
    if (best) break;
  }

  if (best) {
    moved.position = best;
  }

  return nodes;
}

function autoSpaceNodes(
  nodes: SpexlyNode[],
  minGap: number,
  heightMap?: Record<string, number>
): SpexlyNode[] {
  const grouped = new Map<number, SpexlyNode[]>();
  for (const node of nodes) {
    const key = Math.round(node.position.x / 100) * 100;
    const bucket = grouped.get(key) ?? [];
    bucket.push(node);
    grouped.set(key, bucket);
  }

  for (const bucket of grouped.values()) {
    bucket.sort((a, b) => a.position.y - b.position.y);
    for (let i = 1; i < bucket.length; i++) {
      const prev = bucket[i - 1];
      const current = bucket[i];
      const minY = prev.position.y + getNodeHeight(prev, heightMap) + minGap;
      if (current.position.y < minY) {
        current.position = { ...current.position, y: minY };
      }
    }
  }

  return [...nodes];
}

function alignByType(nodes: SpexlyNode[]): SpexlyNode[] {
  const typeOrder: SpexlyNodeType[] = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note'];
  const grouped = new Map<SpexlyNodeType, SpexlyNode[]>();
  for (const node of nodes) {
    const bucket = grouped.get(node.type as SpexlyNodeType) ?? [];
    bucket.push(node);
    grouped.set(node.type as SpexlyNodeType, bucket);
  }

  const maxCount = Math.max(1, ...typeOrder.map((t) => (grouped.get(t)?.length ?? 0)));
  const totalHeight = (maxCount - 1) * ROW_SPACING;
  const startY = -totalHeight / 2;

  for (let i = 0; i < typeOrder.length; i++) {
    const type = typeOrder[i];
    const bucket = grouped.get(type) ?? [];
    for (let j = 0; j < bucket.length; j++) {
      bucket[j].position = {
        x: COLUMN_X[i] ?? i * 420,
        y: startY + j * ROW_SPACING,
      };
    }
  }

  return [...nodes];
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  baselineNodes: [],
  baselineEdges: [],
  nodeHeights: {},
  expandShiftMap: {},

  projectId: null,
  projectName: '',
  isSaving: false,
  lastSavedAt: null,

  onNodesChange: (changes) => {
    const significantChange = changes.some(
      (c) => c.type === 'remove' || (c.type === 'position' && c.dragging === false)
    );
    if (significantChange) get().pushHistory();

    let nextNodes = applyNodeChanges(changes, get().nodes) as SpexlyNode[];
    const heightMap = get().nodeHeights;

    const moved = changes.find((c) => c.type === 'position' && c.dragging === false);
    if (moved && 'id' in moved) {
      const movedNode = nextNodes.find((n) => n.id === moved.id);
      const targetPosition = movedNode ? { ...movedNode.position } : undefined;
      nextNodes = resolveOverlap(nextNodes, moved.id as string, targetPosition, heightMap);
      nextNodes = autoSpaceNodes(nextNodes, BASE_VERTICAL_GAP, heightMap);
    }

    set({ nodes: nextNodes });
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
    const NODE_HEIGHT = 240;

    const existingNodes = get().nodes;
    const isOverlapping = (pos: { x: number; y: number }) => {
      return existingNodes.some((node) => {
        const overlapX = Math.abs(node.position.x - pos.x) < NODE_WIDTH + NODE_GAP;
        const overlapY = Math.abs(node.position.y - pos.y) < NODE_HEIGHT + NODE_GAP;
        return overlapX && overlapY;
      });
    };

    const stepX = NODE_WIDTH + NODE_GAP;
    const stepY = NODE_HEIGHT + NODE_GAP;
    let finalPosition = position;
    if (isOverlapping(position)) {
      const attempts = 25;
      for (let i = 0; i < attempts; i++) {
        const dx = (i % 5) - 2;
        const dy = Math.floor(i / 5) - 2;
        const candidate = {
          x: position.x + dx * stepX,
          y: position.y + dy * stepY,
        };
        if (!isOverlapping(candidate)) {
          finalPosition = candidate;
          break;
        }
      }
    }

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: finalPosition,
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
    const nodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, expanded: !node.data.expanded } }
        : node
    ) as SpexlyNode[];

    const target = nodes.find((n) => n.id === nodeId);
    if (!target) {
      set({ nodes });
      return;
    }

    // Bring expanded node to front
    if (target.data.expanded) {
      target.zIndex = 1000;
    } else if (typeof target.zIndex !== 'undefined') {
      target.zIndex = 0;
    }

    const wasExpanded = !target.data.expanded;
    const prevHeight = getNodeHeight(
      {
        ...target,
        data: { ...target.data, expanded: wasExpanded },
      } as SpexlyNode,
      get().nodeHeights
    );
    const nextHeight = getNodeHeight(target, get().nodeHeights);
    const delta = nextHeight - prevHeight;
    const columnKey = Math.round(target.position.x / 100) * 100;

    if (delta !== 0 && target.data.expanded) {
      const affectedIds: string[] = [];
      for (const node of nodes) {
        const key = Math.round(node.position.x / 100) * 100;
        if (key === columnKey && node.id !== target.id && node.position.y > target.position.y) {
          node.position = { ...node.position, y: node.position.y + delta };
          affectedIds.push(node.id);
        }
      }
      const nextMap = { ...get().expandShiftMap, [nodeId]: { affectedIds, delta } };
      set({ nodes, expandShiftMap: nextMap });
      return;
    }

    if (delta !== 0 && !target.data.expanded) {
      const map = get().expandShiftMap[nodeId];
      if (map) {
        const { affectedIds, delta: storedDelta } = map;
        for (const node of nodes) {
          if (affectedIds.includes(node.id)) {
            node.position = { ...node.position, y: node.position.y - storedDelta };
          }
        }
        const nextMap = { ...get().expandShiftMap };
        delete nextMap[nodeId];
        set({ nodes, expandShiftMap: nextMap });
        return;
      }
    }

    set({ nodes });
  },

  toggleNodeCompleted: (nodeId) => {
    get().pushHistory();
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, completed: !node.data.completed } }
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
    const spaced = autoSpaceNodes(nodes, BASE_VERTICAL_GAP, get().nodeHeights);
    set({
      nodes: spaced,
      edges,
      baselineNodes: JSON.parse(JSON.stringify(spaced)),
      baselineEdges: JSON.parse(JSON.stringify(edges)),
      expandShiftMap: {},
    });
  },

  appendNodesAndEdges: (nodes, edges) => {
    get().pushHistory();
    const existingNodes = get().nodes;

    let offsetX = 0;
    let offsetY = 0;

    if (existingNodes.length > 0) {
      const xs = existingNodes.map((n) => n.position.x);
      const ys = existingNodes.map((n) => n.position.y);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      offsetX = maxX + 380;
      offsetY = minY;
    }

    const adjustedNodes = nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
    })) as SpexlyNode[];

    const spacedAdjusted = autoSpaceNodes(adjustedNodes, BASE_VERTICAL_GAP, get().nodeHeights);

    set({
      nodes: [...existingNodes, ...spacedAdjusted],
      edges: [...get().edges, ...edges],
      expandShiftMap: {},
    });
  },

  smartImport: (updates, newNodes, newEdges) => {
    get().pushHistory();

    // 1. Apply field updates to existing nodes
    let updatedNodes = get().nodes.map((node) => {
      const update = updates.find((u) => u.nodeId === node.id);
      if (!update) return node;
      return { ...node, data: { ...node.data, ...update.fieldsToFill } } as SpexlyNode;
    });

    // 2. Position new nodes offset to the right of existing canvas
    let offsetX = 0;
    let offsetY = 0;

    if (updatedNodes.length > 0) {
      const xs = updatedNodes.map((n) => n.position.x);
      const ys = updatedNodes.map((n) => n.position.y);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      offsetX = maxX + 380;
      offsetY = minY;
    }

    const adjustedNewNodes = newNodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
    })) as SpexlyNode[];

    const spacedNewNodes = autoSpaceNodes(adjustedNewNodes, BASE_VERTICAL_GAP, get().nodeHeights);

    // 3. Auto-connect new feature/techStack nodes to existing idea node
    const existingIdea = updatedNodes.find((n) => n.type === 'idea');
    const autoEdges: SpexlyEdge[] = [];
    if (existingIdea) {
      for (const node of spacedNewNodes) {
        if (node.type === 'feature' || node.type === 'techStack') {
          autoEdges.push({
            id: `e-${existingIdea.id}-${node.id}`,
            source: existingIdea.id,
            target: node.id,
          });
        }
      }
    }

    set({
      nodes: [...updatedNodes, ...spacedNewNodes],
      edges: [...get().edges, ...newEdges, ...autoEdges],
      expandShiftMap: {},
    });
  },

  resetLayout: () => {
    get().pushHistory();
    const { baselineNodes, baselineEdges, nodes, edges } = get();
    if (baselineNodes.length > 0) {
      set({
        nodes: JSON.parse(JSON.stringify(baselineNodes)),
        edges: JSON.parse(JSON.stringify(baselineEdges)),
      });
      return;
    }

    const aligned = alignByType(JSON.parse(JSON.stringify(nodes)) as SpexlyNode[]);
    set({ nodes: aligned, edges });
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
      baselineNodes: JSON.parse(JSON.stringify(nodes)),
      baselineEdges: JSON.parse(JSON.stringify(edges)),
      nodeHeights: {},
      expandShiftMap: {},
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
      baselineNodes: [],
      baselineEdges: [],
      nodeHeights: {},
      expandShiftMap: {},
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

  setNodeHeight: (nodeId, height) => {
    const current = get().nodeHeights[nodeId];
    // Prevent unnecessary updates - increase threshold to avoid rapid updates
    if (current && Math.abs(current - height) < 10) return;
    const nextMap = { ...get().nodeHeights, [nodeId]: height };
    set({ nodeHeights: nextMap });
  },
}));
