'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics/events';

interface ConfirmationState {
  loading: boolean;
  success: boolean;
  message: string;
}

export function WaitlistConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<ConfirmationState>({
    loading: true,
    success: false,
    message: 'Confirming your email...',
  });

  useEffect(() => {
    let mounted = true;

    async function confirmEmail() {
      if (!token) {
        if (!mounted) return;
        setState({
          loading: false,
          success: false,
          message: 'Missing confirmation token.',
        });
        return;
      }

      try {
        const response = await fetch(`/api/waitlist/confirm?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as { ok?: boolean; error?: string };

        if (!mounted) return;

        if (response.ok && data.ok) {
          void trackEvent({
            eventName: 'waitlist_email_confirmed',
            sourcePage: '/waitlist/confirm',
          });
          setState({
            loading: false,
            success: true,
            message: 'Your email is confirmed. You are officially on the waitlist.',
          });
          return;
        }

        setState({
          loading: false,
          success: false,
          message: data.error || 'This confirmation link is invalid or expired.',
        });
      } catch {
        if (!mounted) return;
        setState({
          loading: false,
          success: false,
          message: 'Unable to confirm right now. Please try again later.',
        });
      }
    }

    void confirmEmail();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-wider text-cyan-300">Spexly waitlist</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-100">
        {state.loading ? 'Confirming...' : state.success ? 'Confirmed' : 'Confirmation failed'}
      </h1>
      <p className="mt-4 text-slate-300">{state.message}</p>
      <div className="mt-8">
        <Link href="/" className="rounded-lg border border-slate-600 px-5 py-2 text-sm text-slate-100 hover:border-slate-400">
          Return to homepage
        </Link>
      </div>
    </main>
  );
}
