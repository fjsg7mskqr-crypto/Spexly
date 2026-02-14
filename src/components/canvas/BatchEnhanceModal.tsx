'use client';

import { useState, useMemo } from 'react';
import { X, Sparkles, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { batchEnhanceFeatures, batchEnhanceScreens } from '@/app/actions/batchEnhanceNodes';
import { updateCanvasData } from '@/app/actions/projects';

interface BatchEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EnhanceStatus = 'pending' | 'enhancing' | 'done' | 'failed';

interface NodeEnhanceState {
  nodeId: string;
  name: string;
  type: 'feature' | 'screen';
  status: EnhanceStatus;
  error?: string;
}

export function BatchEnhanceModal({ isOpen, onClose }: BatchEnhanceModalProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const [phase, setPhase] = useState<'select' | 'running' | 'done'>('select');
  const [nodeStates, setNodeStates] = useState<NodeEnhanceState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const enhanceable = useMemo(() => {
    return nodes
      .filter((n) => {
        if (n.type === 'feature') {
          return !n.data.aiContext || n.data.aiContext.trim() === '';
        }
        if (n.type === 'screen') {
          return !n.data.aiContext || n.data.aiContext.trim() === '';
        }
        return false;
      })
      .map((n) => ({
        nodeId: n.id,
        name: n.type === 'feature' ? n.data.featureName : n.type === 'screen' ? n.data.screenName : '',
        type: n.type as 'feature' | 'screen',
      }));
  }, [nodes]);

  if (!isOpen) return null;

  const handleClose = () => {
    setPhase('select');
    setNodeStates([]);
    setError(null);
    onClose();
  };

  const handleStart = async () => {
    setPhase('running');
    setError(null);

    const allStates: NodeEnhanceState[] = enhanceable.map((n) => ({
      ...n,
      status: 'enhancing' as EnhanceStatus,
    }));
    setNodeStates(allStates);

    // Build inputs from current node data
    const featureInputs = enhanceable
      .filter((item) => item.type === 'feature')
      .map((item) => {
        const node = nodes.find((n) => n.id === item.nodeId);
        if (!node || node.type !== 'feature') return null;
        return {
          nodeId: item.nodeId,
          featureName: node.data.featureName,
          summary: node.data.summary,
          problem: node.data.problem,
          userStory: node.data.userStory,
          acceptanceCriteria: Array.isArray(node.data.acceptanceCriteria) ? node.data.acceptanceCriteria : [],
          technicalConstraints: node.data.technicalConstraints,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const screenInputs = enhanceable
      .filter((item) => item.type === 'screen')
      .map((item) => {
        const node = nodes.find((n) => n.id === item.nodeId);
        if (!node || node.type !== 'screen') return null;
        return {
          nodeId: item.nodeId,
          screenName: node.data.screenName,
          purpose: node.data.purpose,
          keyElements: Array.isArray(node.data.keyElements) ? node.data.keyElements : [],
          userActions: Array.isArray(node.data.userActions) ? node.data.userActions : [],
          states: Array.isArray(node.data.states) ? node.data.states : [],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    try {
      // Run features and screens in parallel
      const [featureResults, screenResults] = await Promise.all([
        featureInputs.length > 0 ? batchEnhanceFeatures(featureInputs) : Promise.resolve([]),
        screenInputs.length > 0 ? batchEnhanceScreens(screenInputs) : Promise.resolve([]),
      ]);

      const allResults = [...featureResults, ...screenResults];

      // Apply results to store, only filling empty fields for main fields
      const finalStates = allStates.map((state) => {
        const result = allResults.find((r) => r.nodeId === state.nodeId);
        if (!result) return { ...state, status: 'failed' as EnhanceStatus, error: 'No result returned' };

        if (result.success && result.data) {
          const node = nodes.find((n) => n.id === result.nodeId);
          if (node) {
            const existing = node.data as Record<string, unknown>;
            const filtered: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(result.data)) {
              const current = existing[key];
              const isEmpty =
                current === undefined ||
                current === null ||
                current === '' ||
                (Array.isArray(current) && current.length === 0);
              // Only fill main fields if empty; always update AI-specific fields
              const aiFields = ['aiContext', 'implementationSteps', 'codeReferences', 'testingRequirements', 'relatedFiles', 'technicalConstraints', 'componentHierarchy'];
              if (aiFields.includes(key) || isEmpty) {
                filtered[key] = value;
              }
            }
            updateNodeData(result.nodeId, filtered);
          }
          return { ...state, status: 'done' as EnhanceStatus };
        }
        return { ...state, status: 'failed' as EnhanceStatus, error: result.error };
      });

      setNodeStates(finalStates);

      // Auto-save to Supabase
      const { projectId, nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
      if (projectId) {
        useCanvasStore.getState().setSaveStatus(true);
        await updateCanvasData(projectId, currentNodes, currentEdges);
        useCanvasStore.getState().setSaveStatus(false);
      }
    } catch (err) {
      // Handle rate limit or auth errors
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      setError(message);
      setNodeStates((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'failed' as EnhanceStatus,
          error: message,
        }))
      );
    }

    setPhase('done');
  };

  const enhanced = nodeStates.filter((n) => n.status === 'done').length;
  const failed = nodeStates.filter((n) => n.status === 'failed').length;
  const total = nodeStates.length;
  const progress = total > 0 ? ((enhanced + failed) / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Sparkles size={18} className="text-violet-400" />
            <h2 className="text-lg font-semibold">Enhance All with AI</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={phase === 'running'}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* Select Phase */}
          {phase === 'select' && (
            <>
              {enhanceable.length === 0 ? (
                <div className="text-center py-8">
                  <Check size={32} className="mx-auto mb-3 text-emerald-400" />
                  <p className="text-sm text-slate-300">All nodes already have AI context!</p>
                  <button
                    onClick={handleClose}
                    className="mt-4 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-4">
                    {enhanceable.length} node{enhanceable.length !== 1 ? 's' : ''} need AI context generation:
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {enhanceable.map((item) => (
                      <div
                        key={item.nodeId}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.type === 'feature' ? 'bg-blue-400' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-sm text-slate-200 flex-1 truncate">
                          {item.name || 'Unnamed'}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{item.type}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleStart}
                    className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    <Sparkles size={14} className="inline mr-2" />
                    Enhance {enhanceable.length} Node{enhanceable.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </>
          )}

          {/* Running Phase */}
          {phase === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 size={16} className="animate-spin text-violet-400" />
                Enhancing nodes with AI...
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {nodeStates.map((item) => (
                  <div key={item.nodeId} className="flex items-center gap-2 text-xs">
                    {item.status === 'enhancing' && (
                      <Loader2 size={12} className="animate-spin text-violet-400" />
                    )}
                    {item.status === 'done' && <Check size={12} className="text-emerald-400" />}
                    {item.status === 'failed' && (
                      <AlertTriangle size={12} className="text-red-400" />
                    )}
                    {item.status === 'pending' && (
                      <span className="h-3 w-3 rounded-full border border-slate-600" />
                    )}
                    <span className="text-slate-300 truncate">{item.name || 'Unnamed'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done Phase */}
          {phase === 'done' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                {failed === 0 && enhanced > 0 ? (
                  <Check size={32} className="mx-auto mb-3 text-emerald-400" />
                ) : (
                  <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
                )}
                <p className="text-sm text-slate-200">
                  {enhanced} enhanced{failed > 0 ? `, ${failed} failed` : ''}
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {nodeStates.map((item) => (
                  <div key={item.nodeId} className="flex items-center gap-2 text-xs">
                    {item.status === 'done' && <Check size={12} className="text-emerald-400" />}
                    {item.status === 'failed' && (
                      <AlertTriangle size={12} className="text-red-400" />
                    )}
                    <span className="text-slate-300 truncate">{item.name || 'Unnamed'}</span>
                    {item.error && (
                      <span className="text-red-400 ml-auto truncate max-w-[200px]">
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleClose}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
