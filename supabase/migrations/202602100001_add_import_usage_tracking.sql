-- Track AI import usage and audit logs

-- Usage counter per user per day
CREATE TABLE IF NOT EXISTS public.import_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

-- Audit log for AI import attempts
CREATE TABLE IF NOT EXISTS public.import_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_chars INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  output_nodes INTEGER NOT NULL DEFAULT 0,
  output_edges INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.import_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_audit ENABLE ROW LEVEL SECURITY;

-- Policies: users can read/write their own usage records
DROP POLICY IF EXISTS "Users can view own import usage" ON public.import_usage;
CREATE POLICY "Users can view own import usage"
ON public.import_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own import usage" ON public.import_usage;
CREATE POLICY "Users can upsert own import usage"
ON public.import_usage FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own import usage" ON public.import_usage;
CREATE POLICY "Users can update own import usage"
ON public.import_usage FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies: users can read and insert their own audit rows
DROP POLICY IF EXISTS "Users can view own import audit" ON public.import_audit;
CREATE POLICY "Users can view own import audit"
ON public.import_audit FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own import audit" ON public.import_audit;
CREATE POLICY "Users can insert own import audit"
ON public.import_audit FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_usage_user_date ON public.import_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_import_audit_user_id ON public.import_audit(user_id);
