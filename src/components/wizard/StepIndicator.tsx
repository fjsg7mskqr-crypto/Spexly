'use client';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i < currentStep
              ? 'bg-violet-400'
              : i === currentStep
                ? 'bg-violet-400 ring-2 ring-violet-400/30'
                : 'bg-slate-600'
          }`}
        />
      ))}
    </div>
  );
}
