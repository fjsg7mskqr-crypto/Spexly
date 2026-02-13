'use server';

import { enhanceFeatureWithAI, enhanceScreenWithAI } from './enhanceNodeWithAI';
import type { FeatureNodeData, ScreenNodeData } from '@/types/nodes';

/**
 * Batch enhance multiple features and screens with AI in parallel.
 * Used during import to auto-populate AI context fields.
 */
export async function batchEnhanceFeatures(
  features: Array<{
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
    index: number;
    data?: any;
    error?: string;
  }>
> {
  // Enhance all features in parallel (faster for multiple features)
  const enhancements = await Promise.allSettled(
    features.map((feature, index) =>
      enhanceFeatureWithAI(feature).then((result) => ({ ...result, index }))
    )
  );

  return enhancements.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      index,
      error: result.reason instanceof Error ? result.reason.message : 'Enhancement failed',
    };
  });
}

/**
 * Batch enhance multiple screens with AI in parallel.
 */
export async function batchEnhanceScreens(
  screens: Array<{
    screenName: string;
    purpose?: string;
    keyElements?: string[];
    userActions?: string[];
    states?: string[];
  }>
): Promise<
  Array<{
    success: boolean;
    index: number;
    data?: any;
    error?: string;
  }>
> {
  // Enhance all screens in parallel
  const enhancements = await Promise.allSettled(
    screens.map((screen, index) =>
      enhanceScreenWithAI(screen).then((result) => ({ ...result, index }))
    )
  );

  return enhancements.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      index,
      error: result.reason instanceof Error ? result.reason.message : 'Enhancement failed',
    };
  });
}
