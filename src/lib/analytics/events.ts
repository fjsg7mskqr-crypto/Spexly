'use client';

export type MarketingEventName =
  | 'landing_view'
  | 'cta_click_primary'
  | 'waitlist_form_started'
  | 'waitlist_form_submitted'
  | 'waitlist_email_confirmed'
  | 'generator_started'
  | 'generator_completed'
  | 'canvas_loaded'
  | 'node_created'
  | 'node_status_changed'
  | 'export_clicked';

interface TrackEventInput {
  eventName: MarketingEventName;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}

function getSessionId(): string {
  const key = 'spexly_session_id';
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const value = `${crypto.randomUUID()}-${Date.now()}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

function getUtmData() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
}

export async function trackEvent({ eventName, sourcePage, metadata }: TrackEventInput): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        sessionId: getSessionId(),
        sourcePage: sourcePage || window.location.pathname,
        metadata: metadata || {},
        ...getUtmData(),
      }),
      keepalive: true,
    });
  } catch {
    // Swallow analytics errors so user flows are never blocked.
  }
}
