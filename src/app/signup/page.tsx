import Image from 'next/image'
import { SignUpForm } from '@/components/auth/SignUpForm'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Image src="/spexly-logo-white.png" alt="Spexly" width={1349} height={603} className="mb-6 h-16 w-auto" />
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign in
            </Link>
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  )
}
