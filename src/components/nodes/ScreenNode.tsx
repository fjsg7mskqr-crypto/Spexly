'use client';

import { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { AIContextIndicator } from './AIContextIndicator';
import { useCanvasStore } from '@/store/canvasStore';
import { enhanceScreenWithAI } from '@/app/actions/enhanceNodeWithAI';
import type { ScreenNode as ScreenNodeType } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-colors';

function ScreenNodeComponent({ id, data }: NodeProps<ScreenNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [showAiContext, setShowAiContext] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle migration from old format to new format
  const keyElements = Array.isArray(data.keyElements) ? data.keyElements : [];
  const userActions = Array.isArray(data.userActions) ? data.userActions : [];
  const states = Array.isArray(data.states) ? data.states : [];
  const dataSources = Array.isArray(data.dataSources) ? data.dataSources : [];
  const acceptanceCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const componentHierarchy = Array.isArray(data.componentHierarchy) ? data.componentHierarchy : [];
  const codeReferences = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const purpose = data.purpose ?? '';
  const navigation = data.navigation ?? '';
  const wireframeUrl = data.wireframeUrl ?? '';
  const notes = data.notes ?? '';
  const acceptanceCriteriaValue = acceptanceCriteria.join('\n');
  const componentHierarchyValue = componentHierarchy.join('\n');
  const codeReferencesValue = codeReferences.join('\n');
  const tagsValue = tags.join(', ');

  const subtitle = [purpose ? `Purpose: ${purpose.slice(0, 30)}${purpose.length > 30 ? '...' : ''}` : '']
    .filter(Boolean)
    .join(' · ') || 'Page';

  const handleGenerateAIContext = async () => {
    setIsGenerating(true);
    try {
      const result = await enhanceScreenWithAI({
        screenName: data.screenName,
        purpose: purpose,
        keyElements: keyElements,
        userActions: userActions,
        states: states,
      });

      if (result.success && result.data) {
        const updates: Record<string, unknown> = {};
        // Fill main fields only if currently empty
        if (!data.purpose?.trim() && result.data.purpose) updates.purpose = result.data.purpose;
        if (!data.navigation?.trim() && result.data.navigation) updates.navigation = result.data.navigation;
        if (keyElements.length === 0 && result.data.keyElements.length > 0) {
          updates.keyElements = result.data.keyElements;
        }
        if (userActions.length === 0 && result.data.userActions.length > 0) {
          updates.userActions = result.data.userActions;
        }
        if (states.length === 0 && result.data.states.length > 0) {
          updates.states = result.data.states;
        }
        if (dataSources.length === 0 && result.data.dataSources.length > 0) {
          updates.dataSources = result.data.dataSources;
        }
        // Always update AI-specific fields
        updates.aiContext = result.data.aiContext;
        updates.componentHierarchy = result.data.componentHierarchy;
        updates.codeReferences = result.data.codeReferences;
        updates.testingRequirements = result.data.testingRequirements;
        updateNodeData(id, updates);
        setShowAiContext(true); // Expand to show generated content
      } else {
        alert(`Failed to generate AI context: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate AI context'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <NodeWrapper
      id={id}
      type="screen"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.screenName || 'Screen'}
      subtitle={subtitle}
      headerExtra={<AIContextIndicator data={data} />}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Screen Name</label>
        <input
          className={inputClass}
          placeholder="Screen name"
          value={data.screenName}
          onChange={(e) => updateNodeData(id, { screenName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Purpose</label>
        <textarea
          className={`${inputClass} min-h-[70px] resize-y`}
          placeholder="What is this screen for?"
          rows={2}
          value={purpose}
          onChange={(e) => updateNodeData(id, { purpose: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Key Elements</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Major UI components (one per line)"
          rows={3}
          value={keyElements.join('\n')}
          onChange={(e) =>
            updateNodeData(id, {
              keyElements: e.target.value.split('\n').filter((line) => line.trim()),
            })
          }
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">User Actions</label>
        <textarea
          className={`${inputClass} min-h-[70px] resize-y`}
          placeholder="What can users do? (one per line)"
          rows={2}
          value={userActions.join('\n')}
          onChange={(e) =>
            updateNodeData(id, {
              userActions: e.target.value.split('\n').filter((line) => line.trim()),
            })
          }
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">States</label>
        <textarea
          className={`${inputClass} min-h-[70px] resize-y`}
          placeholder="Empty, loading, error states (one per line)"
          rows={2}
          value={states.join('\n')}
          onChange={(e) =>
            updateNodeData(id, {
              states: e.target.value.split('\n').filter((line) => line.trim()),
            })
          }
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Navigation</label>
        <textarea
          className={`${inputClass} min-h-[60px] resize-y`}
          placeholder="How users get to/from this screen"
          rows={2}
          value={navigation}
          onChange={(e) => updateNodeData(id, { navigation: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Data Sources</label>
        <textarea
          className={`${inputClass} min-h-[70px] resize-y`}
          placeholder="APIs, stores, data needed (one per line)"
          rows={2}
          value={dataSources.join('\n')}
          onChange={(e) =>
            updateNodeData(id, {
              dataSources: e.target.value.split('\n').filter((line) => line.trim()),
            })
          }
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Wireframe URL</label>
        <input
          className={inputClass}
          placeholder="Link to design/wireframe"
          value={wireframeUrl}
          onChange={(e) => updateNodeData(id, { wireframeUrl: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Notes</label>
        <textarea
          className={`${inputClass} min-h-[70px] resize-y`}
          placeholder="Additional context"
          rows={2}
          value={notes}
          onChange={(e) => updateNodeData(id, { notes: e.target.value })}
        />
      </div>

      {/* AI Context Section - Expandable */}
      <div className="border-t border-slate-700/50 pt-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <button
            className="nodrag flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            onClick={() => setShowAiContext(!showAiContext)}
          >
            <span className="font-medium">AI Context & Implementation</span>
            <span className="text-xs">{showAiContext ? '▼' : '▶'}</span>
          </button>

          <button
            className="nodrag px-3 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-md hover:border-emerald-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={handleGenerateAIContext}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </>
            )}
          </button>
        </div>

        {showAiContext && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                AI Context
                <span className="ml-1 text-emerald-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Component structure, styling approach, state management guidance..."
                rows={3}
                value={data.aiContext ?? ''}
                onChange={(e) => updateNodeData(id, { aiContext: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Acceptance Criteria
                <span className="ml-1 text-emerald-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="One criterion per line"
                rows={4}
                value={acceptanceCriteriaValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    acceptanceCriteria: e.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Component Hierarchy
                <span className="ml-1 text-emerald-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="React component breakdown (one per line, e.g., LoginPage > LoginForm > EmailInput)"
                rows={3}
                value={componentHierarchyValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    componentHierarchy: e.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Code References
              </label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Existing components to reference (one per line)"
                rows={3}
                value={codeReferencesValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    codeReferences: e.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Testing Requirements
              </label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="UI/E2E test needs (e.g., Test form validation, Test navigation flow)"
                rows={3}
                value={data.testingRequirements ?? ''}
                onChange={(e) => updateNodeData(id, { testingRequirements: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Tags
              </label>
              <input
                className={inputClass}
                placeholder="comma, separated, tags"
                value={tagsValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                className={inputClass}
                placeholder="Optional time estimate"
                value={data.estimatedHours ?? ''}
                onChange={(e) => updateNodeData(id, { estimatedHours: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export default memo(ScreenNodeComponent);
