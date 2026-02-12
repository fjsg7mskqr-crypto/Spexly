-- Waitlist system for pre-launch landing page
-- Supports double opt-in and source attribution for growth analytics

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  primary_tool TEXT,
  what_building TEXT,
  referral_code TEXT,
  source_page TEXT NOT NULL DEFAULT '/',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirm_token TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_entries_email_normalized
  ON public.waitlist_entries(email_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_entries_confirm_token
  ON public.waitlist_entries(confirm_token)
  WHERE confirm_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status
  ON public.waitlist_entries(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at
  ON public.waitlist_entries(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_waitlist_entries_updated_at ON public.waitlist_entries;
CREATE TRIGGER set_waitlist_entries_updated_at
  BEFORE UPDATE ON public.waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_updated_at();

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Public visitors can submit to the waitlist
DROP POLICY IF EXISTS "Public can insert waitlist entries" ON public.waitlist_entries;
CREATE POLICY "Public can insert waitlist entries"
ON public.waitlist_entries FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Authenticated admins/ops can review rows via SQL editor role-level permissions;
-- no direct SELECT policy for client access is intentionally created.

-- Confirm a waitlist email by token (used by public confirmation endpoint)
CREATE OR REPLACE FUNCTION public.confirm_waitlist_email(token_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.waitlist_entries
  SET status = 'confirmed',
      confirmed_at = NOW(),
      confirm_token = NULL
  WHERE confirm_token = token_input
    AND status = 'pending';

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.confirm_waitlist_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_waitlist_email(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.waitlist_entries IS
  'Pre-launch waitlist entries with double opt-in confirmation and attribution fields';
