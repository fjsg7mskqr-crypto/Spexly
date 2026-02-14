'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Undo2, X } from 'lucide-react';
import { useToastStore, type Toast } from '@/store/toastStore';

const ICON_MAP = {
  error: AlertTriangle,
  success: CheckCircle,
  info: Info,
  undo: Undo2,
};

const COLOR_MAP = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  undo: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

const ICON_COLOR_MAP = {
  error: 'text-red-400',
  success: 'text-emerald-400',
  info: 'text-sky-400',
  undo: 'text-amber-400',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  const Icon = ICON_MAP[toast.type];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl shadow-black/30 animate-slide-up ${COLOR_MAP[toast.type]}`}
    >
      <Icon size={16} className={`shrink-0 ${ICON_COLOR_MAP[toast.type]}`} />
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.type === 'undo' && toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            removeToast(toast.id);
          }}
          className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          <Undo2 size={14} />
          Undo
        </button>
      )}
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 flex flex-col gap-2 w-full max-w-md px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
