'use client';

import type { TargetTool } from '@/types/nodes';
import type { SpexlyTemplate } from '@/lib/templates';

interface WizardStepProps {
  question: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'select' | 'template';
  value: string;
  onChange: (value: string) => void;
  templateOptions?: SpexlyTemplate[];
  isActive?: boolean;
  onSelect?: () => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-colors';

const TOOL_OPTIONS: TargetTool[] = ['Claude', 'Bolt', 'Cursor', 'Lovable', 'Replit', 'Other'];

export function WizardStep({
  question,
  placeholder,
  type,
  value,
  onChange,
  templateOptions,
  isActive = false,
  onSelect,
}: WizardStepProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 transition-all ${
        isActive
          ? 'border-violet-400/60 bg-violet-400/5 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]'
          : 'border-slate-700/50 bg-slate-900/40 opacity-70 hover:opacity-90'
      }`}
      onClick={onSelect}
    >
      <h3 className="mb-3 text-lg font-medium text-slate-100">{question}</h3>
      {type === 'input' && (
        <input
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={isActive}
        />
      )}
      {type === 'textarea' && (
        <textarea
          className={`${inputClass} min-h-[100px] resize-none`}
          placeholder={placeholder}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={isActive}
        />
      )}
      {type === 'select' && (
        <div className="grid grid-cols-2 gap-2">
          {TOOL_OPTIONS.map((tool) => (
            <button
              key={tool}
              type="button"
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                value === tool
                  ? 'border-violet-400 bg-violet-400/10 text-violet-300'
                  : 'border-slate-600/50 bg-slate-800/50 text-slate-300 hover:border-slate-500'
              }`}
              onClick={() => onChange(tool)}
            >
              {tool}
            </button>
          ))}
        </div>
      )}
      {type === 'template' && (
        <div className="grid gap-3">
          {(templateOptions ?? []).map((template) => (
            <button
              key={template.id}
              type="button"
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                value === template.id
                  ? 'border-violet-400 bg-violet-400/10'
                  : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-500'
              }`}
              onClick={() => onChange(template.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{template.label}</div>
                  <div className="text-xs text-slate-400">{template.description}</div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {template.features.length} features · {template.screens.length} screens ·{' '}
                  {template.promptPack.length} prompts
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
