'use client';

import { useEffect, useState } from 'react';
import { X, LayoutGrid, Trash2, Save } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import {
  getUserTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  type UserTemplate,
} from '@/app/actions/templates';
import type { SpexlyNode } from '@/types/nodes';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const setNodesAndEdges = useCanvasStore((s) => s.setNodesAndEdges);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserTemplates();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveUserTemplate(name, description, nodes, edges);
      setTemplates((prev) => [saved, ...prev]);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = (template: UserTemplate) => {
    const { nodes: templateNodes, edges: templateEdges } = template.canvas_data;
    const collapsed = (templateNodes ?? []).map((node) => ({
      ...node,
      data: { ...node.data, expanded: false },
    })) as SpexlyNode[];
    setNodesAndEdges(collapsed, templateEdges ?? []);
    onClose();
  };

  const handleDelete = async (templateId: string) => {
    setError(null);
    try {
      await deleteUserTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-100">
            <LayoutGrid size={18} />
            <h2 className="text-lg font-semibold">Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Save current layout</h3>
            <div className="mt-3 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-violet-400 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-violet-400 focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Your templates</h3>
            {loading && <div className="text-xs text-slate-400">Loading templates...</div>}
            {!loading && templates.length === 0 && (
              <div className="text-xs text-slate-500">No templates saved yet.</div>
            )}

            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-100">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-slate-400">{template.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApply(template)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
