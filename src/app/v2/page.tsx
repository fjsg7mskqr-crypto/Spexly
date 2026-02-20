import type { Metadata } from 'next';
import { LandingPageV2 } from '@/components/landing/LandingPageV2';

export const metadata: Metadata = {
  title: 'Spec It Before You Ship It',
  description:
    'Plan your AI app visually before coding. Join the Spexly waitlist for early access and launch updates.',
  robots: { index: false },
};

export default function HomePageV2() {
  return <LandingPageV2 />;
}
