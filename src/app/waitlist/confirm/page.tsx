import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WaitlistConfirmContent } from '@/components/waitlist/WaitlistConfirmContent';

export const metadata: Metadata = {
  title: 'Confirm Email - Waitlist',
  description: 'Confirm your email to join the Spexly waitlist.',
};

export default function WaitlistConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16 text-center">
          <p className="text-sm uppercase tracking-wider text-cyan-300">Spexly waitlist</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-100">Confirming...</h1>
          <p className="mt-4 text-slate-300">Please wait...</p>
        </main>
      }
    >
      <WaitlistConfirmContent />
    </Suspense>
  );
}
