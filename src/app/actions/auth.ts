'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { authRateLimiter, checkRateLimit, getClientIp } from '@/lib/rate-limit/limiter';
import { AuthenticationError, ValidationError } from '@/lib/errors';

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  if (origin) return origin;

  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;

  return 'http://localhost:3000';
}

async function getClientIdentifier(email: string): Promise<string> {
  const headersList = await headers();
  const ip = getClientIp(new Headers(headersList as HeadersInit));
  return `${email.toLowerCase()}:${ip}`;
}

export async function signInAction(email: string, password: string) {
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const identifier = await getClientIdentifier(email);
  const rateLimitResult = await checkRateLimit(authRateLimiter, identifier);
  if (!rateLimitResult.success) {
    throw new AuthenticationError('Too many login attempts. Please try again in 15 minutes.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthenticationError('Invalid credentials');
  }

  return data;
}

export async function signUpAction(email: string, password: string, firstName?: string) {
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const identifier = await getClientIdentifier(email);
  const rateLimitResult = await checkRateLimit(authRateLimiter, identifier);
  if (!rateLimitResult.success) {
    throw new AuthenticationError('Too many signup attempts. Please try again later.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getBaseUrl()}/auth/callback`,
      data: {
        full_name: firstName,
      },
    },
  });

  if (error) {
    throw new AuthenticationError('Unable to create account');
  }

  return data;
}
