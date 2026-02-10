/**
 * Rate Limiting Configuration
 *
 * Uses Upstash Redis for distributed rate limiting to prevent:
 * - Brute force attacks (auth)
 * - Abuse/spam (project operations)
 * - DoS attacks (canvas saves)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// In development, rate limiting is disabled if env vars are not set
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Rate limiter for authentication attempts
 * Limit: 5 attempts per 15 minutes per IP/user
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * Rate limiter for project CRUD operations
 * Limit: 100 operations per minute per user
 */
export const projectRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:project',
    })
  : null;

/**
 * Rate limiter for canvas save operations
 * Limit: 30 saves per minute per user (prevents spam saves)
 */
export const canvasSaveRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'ratelimit:canvas',
    })
  : null;

/**
 * Helper to check rate limit and throw error if exceeded
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  // In development without Upstash configured, allow all requests
  if (!limiter) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Rate limiting is disabled (Upstash not configured)');
      return { success: true };
    }
    // In production, rate limiting should be configured
    throw new Error('Rate limiting not configured');
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    remaining,
    reset,
  };
}

/**
 * Gets client IP from request headers
 * Use this for IP-based rate limiting
 */
export function getClientIp(headers: Headers): string {
  // Check common headers for IP address
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}
