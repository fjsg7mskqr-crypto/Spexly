'use client';

import { useState } from 'react';
import { X, Check, Copy } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { generateFeaturePrompt, generateCursorPlanPrompt } from '@/lib/export/promptGenerator';

type ExportFormat = 'claude' | 'cursor';

interface FeatureExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: ExportFormat;
}

export function FeatureExportModal({ isOpen, onClose, format }: FeatureExportModalProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const featureNodes = nodes.filter((n) => n.type === 'feature');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFeature = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(featureNodes.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    const selected = featureNodes.filter((n) => selectedIds.has(n.id));
    if (selected.length === 0) return;

    const generator = format === 'claude' ? generateFeaturePrompt : generateCursorPlanPrompt;

    const combined = selected
      .map((feature) => generator(feature, nodes))
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(combined);
      setCopiedMessage(`${selected.length} feature prompt${selected.length > 1 ? 's' : ''} copied!`);
      setTimeout(() => {
        setCopiedMessage(null);
        onClose();
      }, 1500);
    } catch {
      setCopiedMessage('Failed to copy');
      setTimeout(() => setCopiedMessage(null), 2000);
    }
  };

  const formatLabel = format === 'claude' ? 'Claude Code' : 'Cursor Plan Mode';
  const allSelected = selectedIds.size === featureNodes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Copy size={18} className="text-violet-400" />
            <h2 className="text-lg font-semibold">{formatLabel} Export</h2>
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
          <p className="mb-3 text-sm text-slate-300">
            Select features to include in the {formatLabel} prompt:
          </p>

          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-xs text-slate-500">
              {selectedIds.size} of {featureNodes.length} selected
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {featureNodes.map((node) => {
              if (node.type !== 'feature') return null;
              const isSelected = selectedIds.has(node.id);
              return (
                <button
                  key={node.id}
                  onClick={() => toggleFeature(node.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-white/5 bg-slate-800/50 hover:border-white/10'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500'
                        : 'border-slate-500'
                    }`}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-200 truncate block">
                      {node.data.featureName || 'Unnamed Feature'}
                    </span>
                    {node.data.status && (
                      <span className="text-xs text-slate-500">{node.data.status} &middot; {node.data.priority}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {copiedMessage && (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {copiedMessage}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="mt-4 w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy size={14} className="inline mr-2" />
            Copy {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Prompt{selectedIds.size !== 1 ? 's' : ''} to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
