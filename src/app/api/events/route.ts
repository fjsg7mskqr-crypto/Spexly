import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/errors';

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'cta_click_primary',
  'waitlist_form_started',
  'waitlist_form_submitted',
  'waitlist_email_confirmed',
  'generator_started',
  'generator_completed',
  'canvas_loaded',
  'node_created',
  'node_status_changed',
  'export_clicked',
]);

function sanitizeText(value: unknown, maxLength = 128): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const eventName = sanitizeText(payload?.eventName, 64);

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return Response.json({ ok: false, error: 'Invalid event' }, { status: 400 });
    }

    const sessionId = sanitizeText(payload?.sessionId, 128);
    if (!sessionId) {
      return Response.json({ ok: false, error: 'Missing session id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('marketing_events').insert({
      event_name: eventName,
      session_id: sessionId,
      anonymous_or_user_id: sanitizeText(payload?.anonymousOrUserId, 128),
      source_page: sanitizeText(payload?.sourcePage, 128),
      utm_source: sanitizeText(payload?.utm_source, 128),
      utm_medium: sanitizeText(payload?.utm_medium, 128),
      utm_campaign: sanitizeText(payload?.utm_campaign, 128),
      metadata:
        payload?.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
    });

    if (error) {
      logError(error, { action: 'marketing-events.insert', eventName });
      return Response.json({ ok: false, error: 'Unable to capture event' }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    logError(error, { action: 'marketing-events.post' });
    return Response.json({ ok: false, error: 'Unexpected error' }, { status: 500 });
  }
}
