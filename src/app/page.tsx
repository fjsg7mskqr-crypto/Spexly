import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Spec It Before You Ship It',
  description:
    'Plan your AI app visually before coding. Join the Spexly waitlist for early access and launch updates.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
