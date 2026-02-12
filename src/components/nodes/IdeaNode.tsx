'use client';

import { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import type { IdeaNode as IdeaNodeType } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-colors';

function IdeaNodeComponent({ id, data }: NodeProps<IdeaNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [showAiContext, setShowAiContext] = useState(false);

  // Handle migration from old format to new format
  const corePatterns = Array.isArray(data.corePatterns) ? data.corePatterns : [];
  const constraints = Array.isArray(data.constraints) ? data.constraints : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const corePatternsValue = corePatterns.join('\n');
  const constraintsValue = constraints.join('\n');
  const tagsValue = tags.join(', ');

  return (
    <NodeWrapper
      id={id}
      type="idea"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.appName || 'Idea'}
      subtitle={data.appName ? data.appName : 'Untitled project'}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">App Name</label>
        <input
          className={inputClass}
          placeholder="App name"
          value={data.appName}
          onChange={(e) => updateNodeData(id, { appName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Description</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Description"
          rows={2}
          value={data.description}
          onChange={(e) => updateNodeData(id, { description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Target User</label>
        <input
          className={inputClass}
          placeholder="Target user"
          value={data.targetUser}
          onChange={(e) => updateNodeData(id, { targetUser: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Core Problem</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Core problem"
          rows={2}
          value={data.coreProblem}
          onChange={(e) => updateNodeData(id, { coreProblem: e.target.value })}
        />
      </div>

      {/* AI Context Section - Expandable */}
      <div className="border-t border-slate-700/50 pt-3 mt-2">
        <button
          className="nodrag w-full flex items-center justify-between text-sm text-violet-400 hover:text-violet-300 transition-colors mb-2"
          onClick={() => setShowAiContext(!showAiContext)}
        >
          <span className="font-medium">Architecture & Context</span>
          <span className="text-xs">{showAiContext ? '▼' : '▶'}</span>
        </button>

        {showAiContext && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Project Architecture
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="High-level system design (e.g., Client-server architecture, Microservices, Monolith...)"
                rows={4}
                value={data.projectArchitecture ?? ''}
                onChange={(e) => updateNodeData(id, { projectArchitecture: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Core Patterns
                <span className="ml-1 text-violet-400">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Architectural patterns (one per line, e.g., Server Components, React Query, Repository Pattern)"
                rows={3}
                value={corePatternsValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    corePatterns: e.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                Technical Constraints
              </label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Requirements and limitations (one per line, e.g., Must support offline mode, Max bundle size 500KB)"
                rows={3}
                value={constraintsValue}
                onChange={(e) =>
                  updateNodeData(id, {
                    constraints: e.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
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

export default memo(IdeaNodeComponent);
