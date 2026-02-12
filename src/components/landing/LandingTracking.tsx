'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/events';

interface LandingTrackingProps {
  sourcePage?: string;
}

export function LandingTracking({ sourcePage = '/' }: LandingTrackingProps) {
  useEffect(() => {
    void trackEvent({
      eventName: 'landing_view',
      sourcePage,
    });
  }, [sourcePage]);

  return null;
}
