-- Agent automation foundation:
-- 1) task_items: persisted tasks that can be checked off in Spexly
-- 2) agent_ingest_events: idempotent ingest/audit log for external agents

CREATE TABLE IF NOT EXISTS public.task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  source TEXT NOT NULL DEFAULT 'agent',
  source_agent TEXT NOT NULL DEFAULT 'unknown',
  external_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_task_items_user_project ON public.task_items(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_task_items_project_status ON public.task_items(project_id, status);

ALTER TABLE public.task_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task items" ON public.task_items;
CREATE POLICY "Users can view own task items"
ON public.task_items FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task items" ON public.task_items;
CREATE POLICY "Users can insert own task items"
ON public.task_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task items" ON public.task_items;
CREATE POLICY "Users can update own task items"
ON public.task_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task items" ON public.task_items;
CREATE POLICY "Users can delete own task items"
ON public.task_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.agent_ingest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  source_agent TEXT NOT NULL DEFAULT 'unknown',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'accepted', 'rejected')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_ingest_events_project ON public.agent_ingest_events(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_ingest_events_user ON public.agent_ingest_events(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_ingest_events_created_at ON public.agent_ingest_events(created_at DESC);

ALTER TABLE public.agent_ingest_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ingest events" ON public.agent_ingest_events;
CREATE POLICY "Users can view own ingest events"
ON public.agent_ingest_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_task_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_items_updated_at ON public.task_items;
CREATE TRIGGER task_items_updated_at
BEFORE UPDATE ON public.task_items
FOR EACH ROW
EXECUTE FUNCTION public.update_task_items_updated_at();

COMMENT ON TABLE public.task_items IS 'Actionable tasks imported from AI agents or entered by users.';
COMMENT ON TABLE public.agent_ingest_events IS 'Signed webhook ingest audit log with idempotency tracking.';
