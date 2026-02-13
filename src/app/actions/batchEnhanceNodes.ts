'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { enhanceFeatureWithAI, enhanceScreenWithAI } from './enhanceNodeWithAI';
import { AuthenticationError, RateLimitError, logError } from '@/lib/errors';
import {
  checkRateLimit,
  getClientIp,
  batchEnhanceHourlyRateLimiter,
} from '@/lib/rate-limit/limiter';

const MAX_CONCURRENT = 3;

/**
 * Process items with bounded concurrency using a worker pool pattern.
 */
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxConcurrent: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await processor(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Validates auth and rate limiting for batch operations.
 */
async function validateBatchRequest(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError('You must be logged in to enhance nodes.');
  }

  const headerList = await headers();
  const identifier = `${user.id}:${getClientIp(headerList)}`;
  const rateCheck = await checkRateLimit(batchEnhanceHourlyRateLimiter, identifier);
  if (!rateCheck.success) {
    throw new RateLimitError('Batch enhancement limit reached. Try again later.');
  }

  return user.id;
}

/**
 * Batch enhance multiple features with AI in parallel (bounded concurrency).
 * Includes auth check, rate limiting, and nodeId tracking.
 */
export async function batchEnhanceFeatures(
  features: Array<{
    nodeId: string;
    featureName: string;
    summary?: string;
    problem?: string;
    userStory?: string;
    acceptanceCriteria?: string[];
    technicalConstraints?: string;
  }>
): Promise<
  Array<{
    success: boolean;
    nodeId: string;
    data?: Record<string, unknown>;
    error?: string;
  }>
> {
  await validateBatchRequest();

  return processWithConcurrency(
    features,
    async (feature) => {
      try {
        const result = await enhanceFeatureWithAI({
          featureName: feature.featureName,
          summary: feature.summary,
          problem: feature.problem,
          userStory: feature.userStory,
          acceptanceCriteria: feature.acceptanceCriteria,
          technicalConstraints: feature.technicalConstraints,
        });
        return {
          success: result.success,
          nodeId: feature.nodeId,
          data: result.data as Record<string, unknown> | undefined,
          error: result.error,
        };
      } catch (error) {
        logError(error, { action: 'batchEnhanceFeature', nodeId: feature.nodeId });
        return {
          success: false,
          nodeId: feature.nodeId,
          error: error instanceof Error ? error.message : 'Enhancement failed',
        };
      }
    },
    MAX_CONCURRENT
  );
}

/**
 * Batch enhance multiple screens with AI in parallel (bounded concurrency).
 * Includes auth check, rate limiting, and nodeId tracking.
 */
export async function batchEnhanceScreens(
  screens: Array<{
    nodeId: string;
    screenName: string;
    purpose?: string;
    keyElements?: string[];
    userActions?: string[];
    states?: string[];
  }>
): Promise<
  Array<{
    success: boolean;
    nodeId: string;
    data?: Record<string, unknown>;
    error?: string;
  }>
> {
  await validateBatchRequest();

  return processWithConcurrency(
    screens,
    async (screen) => {
      try {
        const result = await enhanceScreenWithAI({
          screenName: screen.screenName,
          purpose: screen.purpose,
          keyElements: screen.keyElements,
          userActions: screen.userActions,
          states: screen.states,
        });
        return {
          success: result.success,
          nodeId: screen.nodeId,
          data: result.data as Record<string, unknown> | undefined,
          error: result.error,
        };
      } catch (error) {
        logError(error, { action: 'batchEnhanceScreen', nodeId: screen.nodeId });
        return {
          success: false,
          nodeId: screen.nodeId,
          error: error instanceof Error ? error.message : 'Enhancement failed',
        };
      }
    },
    MAX_CONCURRENT
  );
}
