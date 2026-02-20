'use client';

import { FormEvent, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/events';

interface WaitlistResponse {
  ok: boolean;
  status?: 'queued' | 'already_joined' | 'confirmed';
  error?: string;
  confirmPreviewUrl?: string;
}

interface WaitlistFormProps {
  compact?: boolean;
}

export function WaitlistForm({ compact = false }: WaitlistFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [primaryTool, setPrimaryTool] = useState('');
  const [whatBuilding, setWhatBuilding] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [website, setWebsite] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmPreviewUrl, setConfirmPreviewUrl] = useState<string | null>(null);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);

  const utmData = useMemo(
    () => ({
      utmSource: searchParams.get('utm_source') || '',
      utmMedium: searchParams.get('utm_medium') || '',
      utmCampaign: searchParams.get('utm_campaign') || '',
    }),
    [searchParams]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setConfirmPreviewUrl(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          primaryTool,
          whatBuilding,
          referralCode,
          sourcePage: pathname,
          website,
          ...utmData,
        }),
      });

      const result = (await response.json()) as WaitlistResponse;

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || 'Unable to submit. Please try again.');
        return;
      }

      if (result.status === 'already_joined') {
        setStatusMessage('You are already on the waitlist. We will keep you posted.');
      } else {
        setStatusMessage('You are in. You have been added to the waitlist.');
      }

      void trackEvent({
        eventName: 'waitlist_form_submitted',
        sourcePage: pathname,
        metadata: {
          status: result.status || 'queued',
        },
      });

      setConfirmPreviewUrl(result.confirmPreviewUrl || null);
      setEmail('');
      setPrimaryTool('');
      setWhatBuilding('');
      setReferralCode('');
      setWebsite('');
    } catch {
      setErrorMessage('Unexpected error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-6"
      onFocusCapture={() => {
        if (hasTrackedStart) return;
        setHasTrackedStart(true);
        void trackEvent({
          eventName: 'waitlist_form_started',
          sourcePage: pathname,
        });
      }}
    >
      <div className="space-y-2">
        <label htmlFor="waitlist-email" className="text-sm font-medium text-slate-100">
          Email
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-400"
        />
      </div>

      <div className={compact ? 'hidden' : 'grid gap-4 sm:grid-cols-2'}>
        <div className="space-y-2">
          <label htmlFor="waitlist-tool" className="text-sm font-medium text-slate-100">
            Primary tool (optional)
          </label>
          <input
            id="waitlist-tool"
            name="primaryTool"
            value={primaryTool}
            onChange={(event) => setPrimaryTool(event.target.value)}
            placeholder="Cursor, Bolt, Claude..."
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="waitlist-referral" className="text-sm font-medium text-slate-100">
            Referral code (optional)
          </label>
          <input
            id="waitlist-referral"
            name="referralCode"
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="Creator or friend code"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-400"
          />
        </div>
      </div>

      <div className={compact ? 'hidden' : 'space-y-2'}>
        <label htmlFor="waitlist-building" className="text-sm font-medium text-slate-100">
          What are you building? (optional)
        </label>
        <textarea
          id="waitlist-building"
          name="whatBuilding"
          value={whatBuilding}
          onChange={(event) => setWhatBuilding(event.target.value)}
          placeholder="A marketplace app, an AI SaaS, a client portal..."
          rows={3}
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-400"
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <p className="text-xs text-slate-300">
        By joining, you agree to receive launch emails. We do not sell personal data.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
      </button>

      {statusMessage ? <p className="text-sm text-emerald-300">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
      {confirmPreviewUrl ? (
        <p className="text-xs text-amber-300">
          Dev preview confirmation link:{' '}
          <a href={confirmPreviewUrl} className="underline" target="_blank" rel="noreferrer">
            open link
          </a>
        </p>
      ) : null}
    </form>
  );
}
