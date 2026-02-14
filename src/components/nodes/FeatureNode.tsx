'use client';

import { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { StatusBadge } from './StatusBadge';
import { AIContextIndicator } from './AIContextIndicator';
import { useCanvasStore } from '@/store/canvasStore';
import { enhanceFeatureWithAI } from '@/app/actions/enhanceNodeWithAI';
import { showError } from '@/store/toastStore';
import type {
  FeatureNode as FeatureNodeType,
  FeaturePriority,
  FeatureStatus,
  FeatureEffort,
} from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-colors';

function FeatureNodeComponent({ id, data }: NodeProps<FeatureNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [showAiContext, setShowAiContext] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const subtitle = `${data.priority} Have · ${data.status} · ${data.effort}`;

  // Handle migration from old format to new format
  const acceptanceCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const dependencies = Array.isArray(data.dependencies) ? data.dependencies : [];
  const implementationSteps = Array.isArray(data.implementationSteps) ? data.implementationSteps : [];
  const codeReferences = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const relatedFiles = Array.isArray(data.relatedFiles) ? data.relatedFiles : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const criteriaValue = acceptanceCriteria.join('\n');
  const dependenciesValue = dependencies.join('\n');
  const implementationStepsValue = implementationSteps.join('\n');
  const codeReferencesValue = codeReferences.join('\n');
  const relatedFilesValue = relatedFiles.join('\n');
  const tagsValue = tags.join(', ');

  const handleGenerateAIContext = async () => {
    setIsGenerating(true);
    try {
      const result = await enhanceFeatureWithAI({
        featureName: data.featureName,
        summary: data.summary,
        problem: data.problem,
        userStory: data.userStory,
        acceptanceCriteria: acceptanceCriteria,
        technicalConstraints: data.technicalConstraints,
      });

      if (result.success && result.data) {
        const updates: Record<string, unknown> = {};
        // Fill main fields only if currently empty
        if (!data.summary?.trim() && result.data.summary) updates.summary = result.data.summary;
        if (!data.problem?.trim() && result.data.problem) updates.problem = result.data.problem;
        if (!data.userStory?.trim() && result.data.userStory) updates.userStory = result.data.userStory;
        if (!data.risks?.trim() && result.data.risks) updates.risks = result.data.risks;
        if (!data.metrics?.trim() && result.data.metrics) updates.metrics = result.data.metrics;
        if (acceptanceCriteria.length === 0 && result.data.acceptanceCriteria.length > 0) {
          updates.acceptanceCriteria = result.data.acceptanceCriteria;
        }
        if (dependencies.length === 0 && result.data.dependencies.length > 0) {
          updates.dependencies = result.data.dependencies;
        }
        // Always update AI-specific fields
        updates.aiContext = result.data.aiContext;
        updates.implementationSteps = result.data.implementationSteps;
        updates.codeReferences = result.data.codeReferences;
        updates.testingRequirements = result.data.testingRequirements;
        updates.relatedFiles = result.data.relatedFiles;
        updates.technicalConstraints = result.data.technicalConstraints;
        updateNodeData(id, updates);
        setShowAiContext(true); // Expand to show generated content
      } else {
        showError(result.error || 'Failed to generate AI context');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to generate AI context');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <NodeWrapper
      id={id}
      type="feature"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.featureName || 'Feature'}
      subtitle={subtitle}
      headerExtra={
        <div className="flex items-center gap-2">
          <AIContextIndicator data={data} />
          <StatusBadge status={data.status} />
        </div>
      }
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Feature Name</label>
        <input
          className={inputClass}
          placeholder="Feature name"
          value={data.featureName}
          onChange={(e) => updateNodeData(id, { featureName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Summary</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="1-2 sentence summary"
          rows={2}
          value={data.summary}
          onChange={(e) => updateNodeData(id, { summary: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Problem</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="What pain does this solve?"
          rows={2}
          value={data.problem}
          onChange={(e) => updateNodeData(id, { problem: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">User Story</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="As a ___, I want ___ so that ___"
          rows={2}
          value={data.userStory}
          onChange={(e) => updateNodeData(id, { userStory: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Acceptance Criteria</label>
        <textarea
          className={`${inputClass} min-h-[110px] resize-y`}
          placeholder="One criterion per line"
          rows={3}
          value={criteriaValue}
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
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Priority</label>
        <select
          className={inputClass}
          value={data.priority}
          onChange={(e) => updateNodeData(id, { priority: e.target.value as FeaturePriority })}
        >
          <option value="Must">Must Have</option>
          <option value="Should">Should Have</option>
          <option value="Nice">Nice to Have</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Status</label>
        <select
          className={inputClass}
          value={data.status}
          onChange={(e) => updateNodeData(id, { status: e.target.value as FeatureStatus })}
        >
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Built">Built</option>
          <option value="Broken">Broken</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Effort</label>
        <select
          className={inputClass}
          value={data.effort}
          onChange={(e) => updateNodeData(id, { effort: e.target.value as FeatureEffort })}
        >
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Dependencies</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="One dependency per line"
          rows={2}
          value={dependenciesValue}
          onChange={(e) =>
            updateNodeData(id, {
              dependencies: e.target.value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Risks</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder="Risks or unknowns"
          rows={2}
          value={data.risks}
          onChange={(e) => updateNodeData(id, { risks: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Success Metrics</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder="How will we measure success?"
          rows={2}
          value={data.metrics}
          onChange={(e) => updateNodeData(id, { metrics: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Notes</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Additional context"
          rows={2}
          value={data.notes}
          onChange={(e) => updateNodeData(id, { notes: e.target.value })}
        />
      </div>

      {/* AI Context Section - Expandable */}
      <div className="border-t border-slate-700/50 pt-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <button
            className="nodrag flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            onClick={() => setShowAiContext(!showAiContext)}
          >
            <span className="font-medium">AI Context & Implementation</span>
            <span className="text-xs">{showAiContext ? '▼' : '▶'}</span>
          </button>

          <button
            className="nodrag px-3 py-1 text-xs font-medium text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-md hover:border-violet-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Information for AI: existing patterns to follow, related file paths, constraints..."
                rows={3}
                value={data.aiContext ?? ''}
                onChange={(e) => updateNodeData(id, { aiContext: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Implementation Steps
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="One step per line (e.g., Create auth schema in database)"
                rows={4}
                value={implementationStepsValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    implementationSteps: e.target.value
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
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="One per line (e.g., See /api/users for similar CRUD patterns)"
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
                Related Files
              </label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="One file path per line (e.g., /src/components/Auth/LoginForm.tsx)"
                rows={3}
                value={relatedFilesValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    relatedFiles: e.target.value
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
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Test coverage needs (e.g., Unit tests for signup/login, integration test for full flow)"
                rows={3}
                value={data.testingRequirements ?? ''}
                onChange={(e) => updateNodeData(id, { testingRequirements: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Technical Constraints
              </label>
              <textarea
                className={`${inputClass} min-h-[70px] resize-y`}
                placeholder="Platform limitations, performance requirements, etc."
                rows={2}
                value={data.technicalConstraints ?? ''}
                onChange={(e) => updateNodeData(id, { technicalConstraints: e.target.value })}
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

export default memo(FeatureNodeComponent);
