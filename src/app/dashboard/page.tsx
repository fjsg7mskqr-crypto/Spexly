import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Dashboard
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Welcome, {user.email}!
        </p>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            User Information
          </h2>
          <dl className="mt-4 space-y-2">
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">Email:</dt>
              <dd className="text-zinc-600 dark:text-zinc-400">{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">User ID:</dt>
              <dd className="text-zinc-600 dark:text-zinc-400">{user.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">Created:</dt>
              <dd className="text-zinc-600 dark:text-zinc-400">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
