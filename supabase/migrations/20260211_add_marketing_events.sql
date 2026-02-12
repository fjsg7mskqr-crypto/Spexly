-- Marketing analytics events for pre-launch funnel measurement

CREATE TABLE IF NOT EXISTS public.marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  anonymous_or_user_id TEXT,
  source_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB,
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_events_event_name
  ON public.marketing_events(event_name);

CREATE INDEX IF NOT EXISTS idx_marketing_events_timestamp
  ON public.marketing_events(timestamp_utc DESC);

ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert marketing events" ON public.marketing_events;
CREATE POLICY "Public can insert marketing events"
ON public.marketing_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

COMMENT ON TABLE public.marketing_events IS
  'Pre-launch marketing events used for waitlist funnel and SEO attribution analytics';
