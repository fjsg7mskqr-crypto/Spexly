'use client';

import { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvasStore';
import { breakdownPrompt } from '@/app/actions/breakdownPrompt';
import type { PromptNode as PromptNodeType, TargetTool } from '@/types/nodes';

const inputClass =
  'nodrag w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30 transition-colors';

function PromptNodeComponent({ id, data }: NodeProps<PromptNodeType>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];

  const handleBreakdown = async () => {
    if (!data.promptText.trim()) return;
    setIsBreakingDown(true);
    try {
      const result = await breakdownPrompt(data.promptText);
      if (result.success && result.breakdown) {
        updateNodeData(id, { breakdown: result.breakdown });
      } else {
        alert(`Failed to break down prompt: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to break down prompt'}`);
    } finally {
      setIsBreakingDown(false);
    }
  };

  return (
    <NodeWrapper
      id={id}
      type="prompt"
      expanded={data.expanded}
      completed={data.completed ?? false}
      headerLabel={data.targetTool ? `Prompt \u2192 ${data.targetTool}` : 'Prompt'}
      subtitle={data.targetTool}
    >
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Prompt</label>
        <textarea
          className={`${inputClass} min-h-[110px] resize-y`}
          placeholder="Prompt text"
          rows={3}
          value={data.promptText}
          onChange={(e) => updateNodeData(id, { promptText: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Target Tool</label>
        <select
          className={inputClass}
          value={data.targetTool}
          onChange={(e) => updateNodeData(id, { targetTool: e.target.value as TargetTool })}
        >
          <option value="Claude">Claude</option>
          <option value="Bolt">Bolt</option>
          <option value="Cursor">Cursor</option>
          <option value="Lovable">Lovable</option>
          <option value="Replit">Replit</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Breakdown Section */}
      <div className="border-t border-slate-700/50 pt-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-slate-400 uppercase tracking-wide">Task Breakdown</label>
          <button
            className="nodrag px-3 py-1 text-xs font-medium text-pink-400 hover:text-pink-300 border border-pink-500/30 rounded-md hover:border-pink-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={handleBreakdown}
            disabled={isBreakingDown || !data.promptText.trim()}
          >
            {isBreakingDown ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Breaking down...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Break Down
              </>
            )}
          </button>
        </div>

        {breakdown.length > 0 && (
          <div className="space-y-1.5">
            {breakdown.map((task, i) => (
              <label key={i} className="nodrag flex items-start gap-2 text-xs text-slate-300 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-400/30 focus:ring-offset-0"
                />
                <span className="group-hover:text-slate-200 transition-colors">{task}</span>
              </label>
            ))}
          </div>
        )}

        {breakdown.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            Click &ldquo;Break Down&rdquo; to decompose this prompt into actionable tasks.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Result Notes</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Result notes"
          rows={2}
          value={data.resultNotes}
          onChange={(e) => updateNodeData(id, { resultNotes: e.target.value })}
        />
      </div>
    </NodeWrapper>
  );
}

export default memo(PromptNodeComponent);
