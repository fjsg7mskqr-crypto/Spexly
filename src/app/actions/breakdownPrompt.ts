'use server';

import OpenAI from 'openai';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  logError,
} from '@/lib/errors';
import {
  checkRateLimit,
  getClientIp,
  wizardHourlyRateLimiter,
} from '@/lib/rate-limit/limiter';

const MAX_PROMPT_LENGTH = 8000;
const MAX_OUTPUT_TOKENS = 2000;

function getModel(): string {
  return process.env.OPENAI_WIZARD_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini';
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError();
  return user.id;
}

async function validateOrigin(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get('origin');

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://spexly.com',
    'https://www.spexly.com',
    'https://spexly.vercel.app',
  ];

  if (process.env.NODE_ENV === 'development') {
    if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
      return;
    }
  }

  if (origin && !allowedOrigins.includes(origin)) {
    throw new ValidationError('Request origin not allowed');
  }
}

function safeParseJson(payload: string): Record<string, unknown> {
  const cleaned = payload
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function breakdownPrompt(promptText: string): Promise<{
  success: boolean;
  breakdown?: string[];
  error?: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'AI is not configured.' };
    }

    if (!promptText.trim() || promptText.length > MAX_PROMPT_LENGTH) {
      return { success: false, error: 'Prompt text is empty or too long.' };
    }

    await validateOrigin();
    const userId = await getAuthUserId();

    const headersList = await headers();
    const identifier = `${userId}:${getClientIp(headersList)}`;
    const rateLimitResult = await checkRateLimit(wizardHourlyRateLimiter, identifier);
    if (!rateLimitResult.success) {
      throw new RateLimitError('Too many AI requests. Please try again later.');
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only assistant. Return ONLY valid JSON with no markdown or explanatory text.',
        },
        {
          role: 'user',
          content: [
            'You are a senior technical project manager. Break down this AI coding prompt into',
            '4-8 specific, actionable implementation tasks.',
            '',
            'Each task must be:',
            '- Concrete enough to execute in one focused coding session (15-45 min)',
            '- Include specific file types, component names, or API patterns where relevant',
            '- Ordered in logical implementation sequence (dependencies first)',
            '- Written as an imperative action ("Create...", "Set up...", "Implement...")',
            '',
            '=== PROMPT TO BREAK DOWN ===',
            promptText,
            '',
            '=== OUTPUT FORMAT ===',
            '{"breakdown": ["task 1", "task 2", ...]}',
            '',
            'Return ONLY the JSON object.',
          ].join('\n'),
        },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const outputText = response.choices[0]?.message?.content?.trim();
    if (!outputText) {
      return { success: false, error: 'AI failed to produce output.' };
    }

    const parsed = safeParseJson(outputText);
    const breakdown = Array.isArray(parsed.breakdown)
      ? (parsed.breakdown as string[])
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim().slice(0, 300))
          .slice(0, 10)
      : [];

    if (breakdown.length === 0) {
      return { success: false, error: 'AI did not return any breakdown tasks.' };
    }

    return { success: true, breakdown };
  } catch (error) {
    logError(error, { action: 'breakdownPrompt' });
    if (error instanceof AuthenticationError || error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to break down prompt.' };
  }
}
