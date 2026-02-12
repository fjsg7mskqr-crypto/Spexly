import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { WaitlistForm } from '@/components/landing/WaitlistForm';

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description: 'Get early access to Spexly and launch updates.',
  alternates: {
    canonical: '/waitlist',
  },
};

export default function WaitlistPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-cyan-300 hover:text-cyan-200">
        Back to homepage
      </Link>
      <h1 className="text-4xl font-semibold text-slate-100">Join the Spexly waitlist</h1>
      <p className="mt-3 text-slate-300">
        Get launch updates, weekly build-planning tips, and first-wave beta invites.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="animate-pulse h-64 bg-slate-800 rounded" />}>
          <WaitlistForm />
        </Suspense>
      </div>
    </main>
  );
}
