import type { SpexlyNode, SpexlyEdge } from './nodes';

export interface CanvasData {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  canvas_data: CanvasData;
  created_at: string;
  updated_at: string;
}
