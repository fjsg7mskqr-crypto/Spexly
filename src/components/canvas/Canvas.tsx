'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type NodeTypes,
  type DefaultEdgeOptions,
} from '@xyflow/react';

import { useCanvasStore } from '@/store/canvasStore';
import { Toolbar } from './Toolbar';
import { DocumentImportModal } from './DocumentImportModal';
import { TemplatesModal } from './TemplatesModal';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { TaskPanel } from '@/components/canvas/TaskPanel';
import { NodeDetailSidebar } from './NodeDetailSidebar';
import { BatchEnhanceModal } from './BatchEnhanceModal';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { GRID_SNAP, CANVAS_BG_COLOR, CANVAS_DOT_COLOR, EDGE_COLOR } from '@/lib/constants';

import IdeaNode from '@/components/nodes/IdeaNode';
import FeatureNode from '@/components/nodes/FeatureNode';
import ScreenNode from '@/components/nodes/ScreenNode';
import TechStackNode from '@/components/nodes/TechStackNode';
import PromptNode from '@/components/nodes/PromptNode';
import NoteNode from '@/components/nodes/NoteNode';

// Must be defined OUTSIDE the component to prevent re-registration on every render
const nodeTypes: NodeTypes = {
  idea: IdeaNode,
  feature: FeatureNode,
  screen: ScreenNode,
  techStack: TechStackNode,
  prompt: PromptNode,
  note: NoteNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
};

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (active as HTMLElement).isContentEditable
  );
}

export function Canvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  const sidebarNodeId = useCanvasStore((s) => s.sidebarNodeId);
  const setSidebarNodeId = useCanvasStore((s) => s.setSidebarNodeId);
  const projectId = useCanvasStore((s) => s.projectId);

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isBatchEnhanceOpen, setIsBatchEnhanceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const resetLayout = useCanvasStore((s) => s.resetLayout);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        e.preventDefault();
        deleteSelected();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo]);

  const minimapNodeColor = useCallback((node: { type?: string }) => {
    const colors: Record<string, string> = {
      idea: '#A78BFA',
      feature: '#60A5FA',
      screen: '#34D399',
      techStack: '#FBBF24',
      prompt: '#F472B6',
      note: '#94A3B8',
    };
    return colors[node.type || ''] || '#94A3B8';
  }, []);

  const isEmpty = nodes.length === 0;

  return (
    <div className="h-screen w-screen" style={{ backgroundColor: CANVAS_BG_COLOR }}>
      <Toolbar
        isDashboardOpen={isDashboardOpen}
        isTaskPanelOpen={isTaskPanelOpen}
        onToggleDashboard={() => setIsDashboardOpen((prev) => !prev)}
        onToggleTaskPanel={() => setIsTaskPanelOpen((prev) => !prev)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onResetLayout={resetLayout}
        onOpenBatchEnhance={() => setIsBatchEnhanceOpen(true)}
        onToggleShortcuts={() => setIsShortcutsOpen((prev) => !prev)}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={GRID_SNAP}
        defaultViewport={{ x: 200, y: 300, zoom: 1 }}
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={CANVAS_DOT_COLOR}
        />
        <MiniMap
          position="bottom-right"
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          nodeColor={minimapNodeColor}
        />
        <Controls
          position="bottom-left"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
      </ReactFlow>

      {/* Empty state */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <div className="pointer-events-auto text-center max-w-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Your canvas is empty</h3>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Start by adding a node from the toolbar, importing a document, or loading a template.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsTemplatesOpen(true)}
                className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                Load Template
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Import Document
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Press <kbd className="rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">?</kbd> for keyboard shortcuts
            </p>
          </div>
        </div>
      )}

      <NodeDetailSidebar
        isOpen={!!sidebarNodeId}
        onClose={() => setSidebarNodeId(null)}
      />
      <ProgressDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
      <TaskPanel
        projectId={projectId}
        isOpen={isTaskPanelOpen}
        onClose={() => setIsTaskPanelOpen(false)}
      />
      <DocumentImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <BatchEnhanceModal isOpen={isBatchEnhanceOpen} onClose={() => setIsBatchEnhanceOpen(false)} />
      <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
