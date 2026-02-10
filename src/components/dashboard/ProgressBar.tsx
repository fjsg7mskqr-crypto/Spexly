'use client';

interface ProgressBarProps {
  percent: number;
  color: string;
  label?: string;
}

export function ProgressBar({ percent, color, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="h-2 w-full rounded-full bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {label && <span className="mt-1 block text-xs text-slate-400">{label}</span>}
    </div>
  );
}
