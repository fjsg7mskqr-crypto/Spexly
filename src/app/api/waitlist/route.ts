import { createClient } from '@/lib/supabase/server';
import { logError, RateLimitError } from '@/lib/errors';
import { checkRateLimit, getClientIp, waitlistRateLimiter } from '@/lib/rate-limit/limiter';
import { validateWaitlistSubmission } from '@/lib/waitlist/validation';

function createConfirmationToken(): string {
  const partA = crypto.randomUUID();
  const partB = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${partA}${partB}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateWaitlistSubmission(payload);

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
    const rateLimitResult = await checkRateLimit(waitlistRateLimiter, ip);

    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many submissions. Please try again later.');
    }

    const supabase = await createClient();
    const confirmToken = createConfirmationToken();

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
      status: 'pending',
      confirm_token: confirmToken,
    });

    if (error) {
      // Unique violation on normalized email => already on waitlist.
      if (error.code === '23505') {
        return Response.json({ ok: true, status: 'already_joined' }, { status: 200 });
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

    // Email provider integration should send this token as a confirmation link.
    // For now, expose it only in development for local testing.
    const confirmationPath = `/waitlist/confirm?token=${encodeURIComponent(confirmToken)}`;
    const confirmationUrl = `${new URL(request.url).origin}${confirmationPath}`;

    return Response.json({
      ok: true,
      status: 'queued',
      confirmPreviewUrl: process.env.NODE_ENV === 'development' ? confirmationUrl : undefined,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ ok: false, error: error.message }, { status: 429 });
    }

    logError(error, { action: 'waitlist.post' });
    return Response.json(
      {
        ok: false,
        error: 'Unexpected error. Please try again.',
      },
      { status: 500 }
    );
  }
}
