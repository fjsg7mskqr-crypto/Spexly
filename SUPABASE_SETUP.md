# Supabase Setup Guide for Spexly

This guide will walk you through setting up Supabase as the backend for Spexly.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js installed on your machine

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Spexly
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the "Settings" icon (gear) in the left sidebar
2. Navigate to "API" under "Configuration"
3. You'll need two values:
   - **Project URL** (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public** key (the `anon` `public` key)

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 4: Set Up Your Database Schema

### Option 1: Using the Supabase Dashboard

1. Go to your project's "SQL Editor" in the Supabase dashboard
2. Create your tables based on your requirements from the PRD

### Option 2: Using the Supabase CLI (Recommended)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   npx supabase login
   ```

3. Link your project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Get your project ref from the project URL: `https://YOUR_PROJECT_REF.supabase.co`)

4. Generate TypeScript types from your database:
   ```bash
   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
   ```

## Step 5: Set Up Authentication

### Enable Email Authentication

1. In your Supabase dashboard, go to "Authentication" → "Providers"
2. Make sure "Email" is enabled
3. Configure email templates under "Authentication" → "Email Templates"

### Enable OAuth Providers (Optional)

1. Go to "Authentication" → "Providers"
2. Enable the providers you want (Google, GitHub, Discord, etc.)
3. Configure each provider with their OAuth credentials

For example, for Google:
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 credentials
- Add authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Copy Client ID and Client Secret to Supabase

## Step 6: Configure Row Level Security (RLS)

Supabase uses PostgreSQL's Row Level Security for data protection. Here's a basic example:

```sql
-- Enable RLS on your tables
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own data
CREATE POLICY "Users can view their own data"
ON your_table_name
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own data
CREATE POLICY "Users can insert their own data"
ON your_table_name
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Step 7: Set Up Realtime (Optional)

If you need real-time subscriptions:

1. Go to "Database" → "Replication" in your Supabase dashboard
2. Enable replication for the tables you want to subscribe to
3. In your code, you can now subscribe to changes:

```typescript
const supabase = createClient()

const channel = supabase
  .channel('table-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'your_table' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Step 8: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. You can test the Supabase connection by adding this to any page:

```typescript
'use client'

import { useSupabase } from '@/hooks/useSupabase'

export default function TestPage() {
  const { user, loading } = useSupabase()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <p>User: {user ? user.email : 'Not logged in'}</p>
    </div>
  )
}
```

## Available Utilities

### Client Components
- `useSupabase()` hook - Get supabase client and auth state in client components
- `createClient()` from `@/lib/supabase/client` - Create a Supabase client for browser

### Server Components
- `createClient()` from `@/lib/supabase/server` - Create a Supabase client for server components and route handlers

### Auth Helpers
- `signUp(email, password)` - Register a new user
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `resetPassword(email)` - Send password reset email
- `signInWithOAuth(provider)` - Sign in with OAuth provider

## Next Steps

1. Define your database schema based on your PRD
2. Set up Row Level Security policies
3. Create authentication pages (login, signup)
4. Build your application features

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
