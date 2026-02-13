import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

export interface SpexlyCanvasExport {
  version: 1;
  exportedAt: string;
  projectName: string;
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

/**
 * Generates a full JSON export of the canvas data.
 * Includes nodes, edges, and metadata for portability and re-import.
 */
export function generateCanvasJSON(
  nodes: SpexlyNode[],
  edges: SpexlyEdge[],
  projectName: string
): string {
  const payload: SpexlyCanvasExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectName,
    nodes,
    edges,
  };
  return JSON.stringify(payload, null, 2);
}
