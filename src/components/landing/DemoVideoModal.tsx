'use client';

import { lazy, Suspense, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/events';

const RemotionPlayer = lazy(() =>
  import('./DemoVideoPlayer').then((mod) => ({ default: mod.DemoVideoPlayer }))
);

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoVideoModal({ open, onOpenChange }: DemoVideoModalProps) {
  const handlePlay = useCallback(() => {
    void trackEvent({
      eventName: 'demo_video_play',
      sourcePage: '/',
      metadata: { placement: 'hero' },
    });
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-4 z-50 m-auto flex max-h-[90vh] max-w-5xl flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl shadow-cyan-900/20 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="w-full" onClick={handlePlay}>
            <Suspense
              fallback={
                <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-900">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              }
            >
              <RemotionPlayer />
            </Suspense>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            45-second demo &middot; No audio
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
