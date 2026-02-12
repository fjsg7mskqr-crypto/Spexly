'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from '@/components/canvas/Canvas';
import { useCanvasStore } from '@/store/canvasStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { Project } from '@/types/project';

interface Props {
  project: Project;
}

export function ProjectCanvas({ project }: Props) {
  const loadProject = useCanvasStore((s) => s.loadProject);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  useEffect(() => {
    const { nodes, edges } = project.canvas_data;
    loadProject(project.id, project.name, nodes ?? [], edges ?? []);

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
