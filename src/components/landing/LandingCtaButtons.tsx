'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics/events';

export function LandingCtaButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href="#waitlist"
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
      </a>
      <Link
        href="/waitlist"
        onClick={() => {
          void trackEvent({
            eventName: 'cta_click_primary',
            sourcePage: '/',
            metadata: { placement: 'hero', target: 'waitlist-page' },
          });
        }}
        className="rounded-lg border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-300"
      >
        Watch 45-second Demo
      </Link>
    </div>
  );
}
