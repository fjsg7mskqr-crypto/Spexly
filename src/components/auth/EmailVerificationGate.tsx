'use client';

/**
 * Email Verification Gate Component
 *
 * Blocks access to the app until the user verifies their email.
 * Shows a message prompting them to check their inbox and provides
 * a button to resend the verification email.
 */

import { useEffect, useState } from 'react';
import { checkEmailVerification, resendVerificationEmail, signOut } from '@/lib/supabase/auth-helpers';

interface EmailVerificationGateProps {
  children: React.ReactNode;
}

export function EmailVerificationGate({ children }: EmailVerificationGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  async function checkVerificationStatus() {
    try {
      const verified = await checkEmailVerification();
      setIsVerified(verified);
    } catch (error) {
      console.error('Error checking email verification:', error);
      setIsVerified(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendEmail() {
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // If no user or already verified, show the app
  if (isVerified === null || isVerified === true) {
    return <>{children}</>;
  }

  // Show verification gate
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900">
            <svg
              className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification link to your email address. Please check your inbox and click the link to continue.
          </p>
        </div>

        {/* Success message */}
        {resendSuccess && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Verification email sent! Please check your inbox.
          </div>
        )}

        {/* Error message */}
        {resendError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {resendError}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend verification email'}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            I've verified, refresh page
          </button>

          <button
            onClick={handleSignOut}
            className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Sign out
          </button>
        </div>

        {/* Help text */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Didn't receive the email? Check your spam folder or try resending.</p>
        </div>
      </div>
    </div>
  );
}
