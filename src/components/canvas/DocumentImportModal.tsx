'use client';

import { useMemo, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { importDocumentWithAI, smartImportDocument } from '@/app/actions/import';
import { updateCanvasData } from '@/app/actions/projects';
import { getPopulatedFields } from '@/lib/import/mergeStrategy';
import type { SpexlyNode } from '@/types/nodes';
import type { ExistingNodeSummary } from '@/types/nodes';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNodePrimaryName(node: SpexlyNode): string {
  const data = node.data as Record<string, unknown>;
  if (node.type === 'idea') return (data.appName as string) || '';
  if (node.type === 'feature') return (data.featureName as string) || '';
  if (node.type === 'screen') return (data.screenName as string) || '';
  if (node.type === 'techStack') return (data.toolName as string) || '';
  if (node.type === 'prompt') return (data.promptText as string) || '';
  if (node.type === 'note') return (data.title as string) || '';
  return '';
}

function buildExistingNodeSummaries(nodes: SpexlyNode[]): ExistingNodeSummary[] {
  return nodes
    .filter((node) => ['idea', 'feature', 'screen', 'techStack'].includes(node.type))
    .map((node) => ({
      id: node.id,
      type: node.type as ExistingNodeSummary['type'],
      name: getNodePrimaryName(node),
      populatedFields: getPopulatedFields(node.data as Record<string, unknown>),
    }));
}

export function DocumentImportModal({ isOpen, onClose }: DocumentImportModalProps) {
  const appendNodesAndEdges = useCanvasStore((s) => s.appendNodesAndEdges);
  const smartImport = useCanvasStore((s) => s.smartImport);
  const nodes = useCanvasStore((s) => s.nodes);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'fallback' | 'smart'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    const lines = text.split(/\r?\n/).filter(Boolean).length;
    return { lines };
  }, [text]);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Paste a document or notes to import.');
      return;
    }

    setIsImporting(true);
    try {
      const hasExistingNodes = nodes.length > 0;

      if (hasExistingNodes) {
        // Smart import path — fill existing nodes + create missing
        const summaries = buildExistingNodeSummaries(nodes);
        const result = await smartImportDocument(trimmed, summaries);

        smartImport(result.updates, result.newNodes, result.newEdges);

        const { projectId, nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
        if (projectId) {
          useCanvasStore.getState().setSaveStatus(true);
          await updateCanvasData(projectId, currentNodes, currentEdges);
          useCanvasStore.getState().setSaveStatus(false);
        }

        const { summary } = result;
        const parts: string[] = [];
        if (summary.nodesUpdated > 0) {
          parts.push(`Updated ${summary.nodesUpdated} nodes (${summary.fieldsFilledTotal} fields filled)`);
        }
        if (summary.nodesCreated > 0) {
          parts.push(`created ${summary.nodesCreated} new nodes`);
        }
        if (parts.length === 0) {
          parts.push('No changes needed');
        }

        setStatus({ type: 'smart', message: parts.join(', ') + '.' });
      } else {
        // Legacy path — empty canvas, create everything from scratch
        const { nodes: importedNodes, edges, mode } = await importDocumentWithAI(trimmed);
        if (importedNodes.length === 0) {
          setError('No importable content found. Try adding headings or bullet lists.');
          return;
        }
        appendNodesAndEdges(importedNodes, edges);

        const { projectId, nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
        if (projectId) {
          useCanvasStore.getState().setSaveStatus(true);
          await updateCanvasData(projectId, currentNodes, currentEdges);
          useCanvasStore.getState().setSaveStatus(false);
        }

        if (mode === 'fallback') {
          setStatus({ type: 'fallback', message: 'AI unavailable. Imported with standard parser.' });
        } else {
          setStatus({ type: 'success', message: 'AI import successful.' });
        }
      }

      setTimeout(() => {
        setStatus(null);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import document.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10">
      <div className="w-full max-h-[90vh] max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-100">
            <FileText size={18} />
            <h2 className="text-lg font-semibold">Import Document</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          <p className="text-sm text-slate-300">
          Paste a PRD, brief, or markdown. Headings like &quot;Features&quot;, &quot;Screens&quot;, and &quot;Tech Stack&quot; work best.
          </p>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your document here..."
            rows={10}
            className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
          />

        {preview && (
          <div className="mt-3 text-xs text-slate-400">
            Preview: {preview.lines} lines detected
          </div>
        )}

        {status && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              status.type === 'success' || status.type === 'smart'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
            }`}
          >
            {status.message}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Tip: Use bullet lists for features and screens.
            </div>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isImporting ? 'Importing...' : 'Import to Canvas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
