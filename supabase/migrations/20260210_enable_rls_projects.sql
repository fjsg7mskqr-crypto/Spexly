-- Enable Row Level Security on projects table
-- This is the foundation of database-level security
-- Without RLS, users could bypass application-level checks by calling Supabase API directly

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own projects
-- This prevents users from reading other users' project data
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can only INSERT with their own user_id
-- This prevents users from creating projects under another user's ID
CREATE POLICY "Users can create own projects"
ON projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own projects
-- Both USING and WITH CHECK ensure users can only modify their own data
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own projects
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Performance indexes
-- These indexes ensure RLS policies don't impact query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Comments for documentation
COMMENT ON POLICY "Users can view own projects" ON projects IS
  'Row Level Security: Authenticated users can only view their own projects';
COMMENT ON POLICY "Users can create own projects" ON projects IS
  'Row Level Security: Authenticated users can only create projects with their own user_id';
COMMENT ON POLICY "Users can update own projects" ON projects IS
  'Row Level Security: Authenticated users can only update their own projects';
COMMENT ON POLICY "Users can delete own projects" ON projects IS
  'Row Level Security: Authenticated users can only delete their own projects';
