'use client';

import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info' | 'undo';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** For 'undo' type: callback when user clicks Undo */
  onUndo?: () => void;
  /** Auto-dismiss duration in ms (default 4000, 0 = manual dismiss only) */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${nextId++}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/** Convenience helpers */
export function showToast(type: ToastType, message: string, duration?: number) {
  return useToastStore.getState().addToast({ type, message, duration });
}

export function showError(message: string) {
  return showToast('error', message, 5000);
}

export function showSuccess(message: string) {
  return showToast('success', message, 3000);
}

export function showUndo(message: string, onUndo: () => void) {
  return useToastStore.getState().addToast({
    type: 'undo',
    message,
    onUndo,
    duration: 5000,
  });
}
