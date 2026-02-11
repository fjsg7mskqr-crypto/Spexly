'use client';

import { useMemo, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { importDocumentWithAI } from '@/app/actions/import';
import { updateCanvasData } from '@/app/actions/projects';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentImportModal({ isOpen, onClose }: DocumentImportModalProps) {
  const appendNodesAndEdges = useCanvasStore((s) => s.appendNodesAndEdges);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'fallback'; message: string } | null>(null);
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
      const { nodes, edges, mode } = await importDocumentWithAI(trimmed);
      if (nodes.length === 0) {
        setError('No importable content found. Try adding headings or bullet lists.');
        return;
      }
      appendNodesAndEdges(nodes, edges);
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
          Paste a PRD, brief, or markdown. Headings like “Features”, “Screens”, and “Tech Stack” work best.
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
              status.type === 'success'
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
