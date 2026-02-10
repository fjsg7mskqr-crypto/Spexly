import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Sign in to Spexly
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign up
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
