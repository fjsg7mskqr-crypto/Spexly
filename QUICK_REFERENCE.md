# Spexly Supabase Quick Reference

## Setup Checklist

- [ ] Create Supabase project at https://supabase.com/dashboard
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add your Supabase URL and anon key to `.env.local`
- [ ] Define your database schema in Supabase dashboard
- [ ] Enable Row Level Security (RLS) on your tables
- [ ] Enable authentication providers (Email, OAuth, etc.)
- [ ] Generate TypeScript types: `npm run supabase:types`
- [ ] Enable Realtime replication for tables that need it

## File Structure

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server client
│       ├── auth-helpers.ts        # Auth utility functions
│       ├── realtime-helpers.ts    # Realtime subscriptions
│       ├── database.types.ts      # Auto-generated types
│       └── types.ts               # Type helpers
├── hooks/
│   ├── useSupabase.ts            # Client-side auth hook
│   └── useRealtimeSubscription.ts # Realtime subscription hooks
├── components/
│   └── auth/
│       ├── LoginForm.tsx          # Login component
│       └── SignUpForm.tsx         # Signup component
├── app/
│   ├── login/page.tsx            # Login page
│   ├── signup/page.tsx           # Signup page
│   ├── dashboard/page.tsx        # Protected dashboard example
│   └── auth/
│       └── callback/route.ts     # OAuth callback handler
└── middleware.ts                  # Auth middleware
```

## Common Operations

### Client Components (Browser)

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()

  // Query data
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
}
```

### Server Components

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  // Query data
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
}
```

### Route Handlers (API Routes)

```tsx
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('table_name')
    .select('*')

  return Response.json(data)
}
```

### Authentication

```tsx
// In a client component
import { signIn, signUp, signOut } from '@/lib/supabase/auth-helpers'

// Sign up
await signUp('user@example.com', 'password')

// Sign in
await signIn('user@example.com', 'password')

// Sign out
await signOut()
```

### Using the Auth Hook

```tsx
'use client'
import { useSupabase } from '@/hooks/useSupabase'

export function MyComponent() {
  const { user, loading, supabase } = useSupabase()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return <div>Welcome {user.email}</div>
}
```

### Realtime Subscriptions

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useTableSubscription } from '@/hooks/useRealtimeSubscription'

export function RealtimeComponent() {
  const [items, setItems] = useState([])

  useTableSubscription('table_name', '*', (payload) => {
    if (payload.eventType === 'INSERT') {
      setItems(prev => [...prev, payload.new])
    }
  })

  return <div>...</div>
}
```

### Database Queries

```typescript
// SELECT
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value')

// INSERT
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: 'value' })

// UPDATE
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 123)

// DELETE
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 123)
```

## NPM Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run supabase:types` - Generate TypeScript types from your linked Supabase project
- `npm run supabase:types:local` - Generate types from local Supabase instance

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Protecting Routes

### Method 1: Redirect in Server Component
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected content</div>
}
```

### Method 2: Middleware (Uncomment in middleware.ts)
```typescript
if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

## Row Level Security (RLS) Examples

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own data"
ON table_name FOR DELETE
USING (auth.uid() = user_id);
```

## Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

## Next Steps

1. Create your Supabase project
2. Design your database schema
3. Set up authentication providers
4. Configure RLS policies
5. Generate TypeScript types
6. Start building your features!
