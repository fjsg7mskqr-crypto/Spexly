'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { updateCanvasData } from '@/app/actions/projects';

const DEBOUNCE_MS = 2000;

export function useAutoSave() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string>('');
  const pendingSaveRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      const { projectId, nodes, edges } = state;
      if (!projectId) return;

      const snapshot = JSON.stringify({ nodes, edges });
      if (snapshot === lastSnapshotRef.current) return;

      // Mark snapshot immediately to avoid re-triggering on non-node updates
      lastSnapshotRef.current = snapshot;
      pendingSaveRef.current = true;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        useCanvasStore.getState().setSaveStatus(true);
        try {
          await updateCanvasData(projectId, nodes, edges);
        } catch (err) {
          // Only log errors in development to prevent information leakage
          if (process.env.NODE_ENV === 'development') {
            console.error('Auto-save failed:', err);
          }
        } finally {
          useCanvasStore.getState().setSaveStatus(false);
          pendingSaveRef.current = false;
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const { isSaving, projectId } = useCanvasStore.getState();
      if (!projectId) return;
      if (!isSaving && !pendingSaveRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}
