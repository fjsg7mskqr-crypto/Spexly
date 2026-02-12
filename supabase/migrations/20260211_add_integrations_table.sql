-- Create integrations table for storing OAuth tokens and integration metadata
-- Supports Notion, Figma, Linear, and future integrations

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'figma', 'linear')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own integrations
CREATE POLICY "Users can view their own integrations"
  ON integrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
  ON integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
  ON integrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
  ON integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE integrations IS 'Stores OAuth tokens and metadata for third-party integrations (Notion, Figma, Linear)';
COMMENT ON COLUMN integrations.provider IS 'Integration provider: notion, figma, or linear';
COMMENT ON COLUMN integrations.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN integrations.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN integrations.token_expires_at IS 'When the access token expires (null if non-expiring)';
COMMENT ON COLUMN integrations.metadata IS 'Provider-specific metadata (workspace ID, team ID, etc.)';
