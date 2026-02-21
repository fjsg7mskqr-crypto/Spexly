import type { Metadata } from 'next';
import { LandingPageV2 } from '@/components/landing/LandingPageV2';

export const metadata: Metadata = {
  title: 'Spexly — Visual Project Planner for Vibe Coding',
  description:
    'Stop burning AI credits on bad prompts. Spexly is a visual planning workspace for vibe coders — map features, screens, and prompts before you build in Cursor, Bolt, or Claude.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Spexly — Visual Project Planner for Vibe Coding',
    description:
      'Stop burning AI credits on bad prompts. Map features, screens, and prompts visually before you build in Cursor, Bolt, or Claude.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Spexly — Plan your vibe coding project visually',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spexly — Visual Project Planner for Vibe Coding',
    description:
      'Stop burning AI credits on bad prompts. Map features, screens, and prompts visually before you build in Cursor, Bolt, or Claude.',
    images: ['/og-image.png'],
  },
};

export default function HomePage() {
  return <LandingPageV2 />;
}
