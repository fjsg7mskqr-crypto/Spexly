'use client';

import type { TargetTool } from '@/types/nodes';

interface WizardStepProps {
  question: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-colors';

const TOOL_OPTIONS: TargetTool[] = ['Claude', 'Bolt', 'Cursor', 'Lovable', 'Replit', 'Other'];

export function WizardStep({ question, placeholder, type, value, onChange }: WizardStepProps) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-medium text-slate-100">{question}</h3>
      {type === 'input' && (
        <input
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
      {type === 'textarea' && (
        <textarea
          className={`${inputClass} min-h-[100px] resize-none`}
          placeholder={placeholder}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
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
    </div>
  );
}
