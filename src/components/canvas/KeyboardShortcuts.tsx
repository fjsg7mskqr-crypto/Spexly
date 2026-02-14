'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '\u2318' : 'Ctrl';

const SHORTCUTS = [
  { keys: [`${mod}+Z`], description: 'Undo' },
  { keys: [`${mod}+Shift+Z`], description: 'Redo' },
  { keys: ['Delete', 'Backspace'], description: 'Delete selected nodes' },
  { keys: ['Scroll'], description: 'Zoom in/out' },
  { keys: ['Click + Drag'], description: 'Pan canvas' },
  { keys: ['Shift + Click'], description: 'Multi-select nodes' },
  { keys: ['?'], description: 'Toggle this panel' },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{shortcut.description}</span>
              <div className="flex items-center gap-1.5">
                {shortcut.keys.map((key, i) => (
                  <span key={key}>
                    {i > 0 && <span className="text-xs text-slate-600 mx-1">/</span>}
                    <kbd className="inline-block rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
