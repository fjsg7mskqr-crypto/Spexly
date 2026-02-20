'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/events';
import { DemoVideoModal } from '@/components/landing/DemoVideoModal';

export function LandingCtaButtons() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <motion.a
          href="#waitlist"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            void trackEvent({
              eventName: 'cta_click_primary',
              sourcePage: '/',
              metadata: { placement: 'hero', target: 'waitlist-anchor' },
            });
          }}
          className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Join Waitlist
        </motion.a>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <button
            type="button"
            onClick={() => {
              setDemoOpen(true);
              void trackEvent({
                eventName: 'demo_video_open',
                sourcePage: '/',
                metadata: { placement: 'hero', target: 'demo-modal' },
              });
            }}
            className="inline-block rounded-lg border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-300"
          >
            Watch 45-second Demo
          </button>
        </motion.div>
      </div>

      <DemoVideoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </>
  );
}
