import { createClient } from '@/lib/supabase/server';
import { logError, RateLimitError } from '@/lib/errors';
import { checkRateLimit, getClientIp, waitlistRateLimiter } from '@/lib/rate-limit/limiter';
import { validateWaitlistSubmission, type WaitlistSubmissionInput } from '@/lib/waitlist/validation';

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const validation = validateWaitlistSubmission(payload as WaitlistSubmissionInput);

    if (!validation.valid || !validation.data) {
      return Response.json(
        {
          ok: false,
          error: validation.error || 'Invalid submission',
        },
        { status: 400 }
      );
    }

    // Honeypot: silently accept and discard bot-like submissions.
    if (validation.data.honeypotTriggered) {
      return Response.json({ ok: true, status: 'queued' });
    }

    const ip = getClientIp(request.headers);
    const rateLimitResult = await checkRateLimit(waitlistRateLimiter, ip, {
      allowWhenUnconfigured: true,
    });

    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many submissions. Please try again later.');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return Response.json(
        {
          ok: false,
          error: 'Server configuration is incomplete (Supabase env vars missing).',
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from('waitlist_entries').insert({
      email: validation.data.email,
      email_normalized: validation.data.emailNormalized,
      primary_tool: validation.data.primaryTool,
      what_building: validation.data.whatBuilding,
      referral_code: validation.data.referralCode,
      source_page: validation.data.sourcePage,
      utm_source: validation.data.utmSource,
      utm_medium: validation.data.utmMedium,
      utm_campaign: validation.data.utmCampaign,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      // Unique violation on normalized email => already on waitlist.
      if (error.code === '23505') {
        return Response.json({ ok: true, status: 'already_joined' }, { status: 200 });
      }

      // Missing table/function typically means migrations have not been applied yet.
      if (error.code === '42P01') {
        logError(error, { action: 'waitlist.insert.table_missing', ip });
        return Response.json(
          {
            ok: false,
            error: 'Waitlist is not configured yet. Please contact support.',
          },
          { status: 500 }
        );
      }

      logError(error, { action: 'waitlist.insert', ip });
      return Response.json(
        {
          ok: false,
          error: 'Unable to join waitlist right now. Please try again.',
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      status: 'confirmed',
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ ok: false, error: error.message }, { status: 429 });
    }

    logError(error, { action: 'waitlist.post' });
    const debugMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error ? ` (${error.message})` : '';
    return Response.json(
      {
        ok: false,
        error: `Unexpected error. Please try again.${debugMessage}`,
      },
      { status: 500 }
    );
  }
}
