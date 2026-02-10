import { createClient } from './client'
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit/limiter'
import { RateLimitError } from '@/lib/errors'

export async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Email confirmation is required before users can sign in
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  // Rate limit login attempts by email to prevent brute force
  const rateLimitResult = await checkRateLimit(authRateLimiter, email)

  if (!rateLimitResult.success) {
    throw new RateLimitError(
      'Too many login attempts. Please try again in 15 minutes.'
    )
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  })

  if (error) throw error
  return data
}

export async function signInWithOAuth(provider: 'google' | 'github' | 'discord') {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

/**
 * Checks if the current user's email is verified
 * Returns null if no user is logged in
 */
export async function checkEmailVerification(): Promise<boolean | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // OAuth users are automatically verified
  if (user.app_metadata.provider && user.app_metadata.provider !== 'email') {
    return true
  }

  // Check if email is confirmed
  return user.email_confirmed_at != null
}

/**
 * Resends the email verification link to the current user
 */
export async function resendVerificationEmail(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('No user email found')
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
}
