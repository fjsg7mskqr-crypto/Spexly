'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from '@/components/canvas/Canvas';
import { useCanvasStore } from '@/store/canvasStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { Project } from '@/types/project';
import type { SpexlyNode } from '@/types/nodes';

const HTML_ENTITY_RE = /&(?:amp|lt|gt|quot|#x27|#x2F);/;

/** Decode HTML entities that were incorrectly baked into stored data. */
function decodeHtmlEntities(str: string): string {
  if (!HTML_ENTITY_RE.test(str)) return str;
  let prev = '';
  let result = str;
  // Repeatedly decode until stable (handles multi-pass encoding like &amp;#x27;)
  while (result !== prev) {
    prev = result;
    result = result
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }
  return result;
}

/** Walk all string fields in node data and decode HTML entities. */
function decodeNodeData(nodes: SpexlyNode[]): SpexlyNode[] {
  return nodes.map((node) => {
    const data: Record<string, unknown> = { ...node.data };
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') {
        data[key] = decodeHtmlEntities(data[key]);
      }
    }
    return { ...node, data } as SpexlyNode;
  });
}

interface Props {
  project: Project;
}

export function ProjectCanvas({ project }: Props) {
  const loadProject = useCanvasStore((s) => s.loadProject);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  useEffect(() => {
    const { nodes, edges } = project.canvas_data;
    const cleanNodes = decodeNodeData(nodes ?? []);
    loadProject(project.id, project.name, cleanNodes, edges ?? []);

    return () => {
      clearCanvas();
    };
    // Only reload when project ID changes - avoid canvas_data object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  useAutoSave();

  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
