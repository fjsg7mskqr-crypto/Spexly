'use server';

import OpenAI from 'openai';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  DatabaseError,
  RateLimitError,
  ValidationError,
  logError,
} from '@/lib/errors';
import {
  checkRateLimit,
  getClientIp,
  wizardDailyRateLimiter,
  wizardHourlyRateLimiter,
} from '@/lib/rate-limit/limiter';
import type {
  FeaturePriority,
  FeatureStatus,
  TargetTool,
  TechCategory,
} from '@/types/nodes';

const MAX_INPUT_LENGTH = 4000;
const MAX_OUTPUT_TOKENS = 900;
const MAX_FEATURES = 15;
const MAX_SCREENS = 15;
const MAX_PROMPTS = 8;
const MAX_TECH = 10;
const MAX_TEXT_FIELD = 320;

const FEATURE_PRIORITIES = new Set<FeaturePriority>(['Must', 'Should', 'Nice']);
const FEATURE_STATUSES = new Set<FeatureStatus>(['Planned', 'In Progress', 'Built', 'Broken', 'Blocked']);
const TARGET_TOOLS = new Set<TargetTool>(['Claude', 'Bolt', 'Cursor', 'Lovable', 'Replit', 'Other']);
const TECH_CATEGORIES = new Set<TechCategory>(['Frontend', 'Backend', 'Database', 'Auth', 'Hosting', 'Other']);

export interface WizardEnhanceInput {
  appName: string;
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string[];
  screens: string[];
  tool: TargetTool;
  templateName?: string;
  templateFeatures?: string[];
  templateScreens?: string[];
  templateTechStack?: { category: TechCategory; toolName: string; notes?: string }[];
  templatePrompts?: { text: string; targetTool?: TargetTool }[];
}

export interface WizardEnhanceOutput {
  idea: {
    appName: string;
    description: string;
    targetUser: string;
    coreProblem: string;
  };
  features: { featureName: string; description: string; priority: FeaturePriority; status: FeatureStatus }[];
  screens: { screenName: string; description: string; keyElements: string }[];
  techStack: { category: TechCategory; toolName: string; notes?: string }[];
  prompts: { text: string; targetTool?: TargetTool }[];
}

function isAiEnabled(): boolean {
  return process.env.AI_WIZARD_ENABLED === 'true';
}

function normalizeModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return 'gpt-4.1-mini';
  if (trimmed === '4.1-mini') return 'gpt-4.1-mini';
  if (trimmed === '4.1') return 'gpt-4.1';
  return trimmed;
}

function getModel(): string {
  return normalizeModel(process.env.OPENAI_WIZARD_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini');
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError();
  return user.id;
}

async function validateOrigin(headersList: Headers): Promise<void> {
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');

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

  if (!origin && referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    if (!allowedOrigins.includes(refererOrigin)) {
      throw new ValidationError('Request referer not allowed');
    }
  }
}

function clampText(value: string): string {
  return value.trim().slice(0, MAX_TEXT_FIELD);
}

function clampList(values: string[], max: number): string[] {
  return values.filter(Boolean).map(clampText).slice(0, max);
}

function safeParseJson(payload: string): Record<string, unknown> {
  const cleaned = payload
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

function sanitizePriority(value: unknown): FeaturePriority {
  return FEATURE_PRIORITIES.has(value as FeaturePriority) ? (value as FeaturePriority) : 'Must';
}

function sanitizeStatus(value: unknown): FeatureStatus {
  return FEATURE_STATUSES.has(value as FeatureStatus) ? (value as FeatureStatus) : 'Planned';
}

function sanitizeTool(value: unknown): TargetTool | undefined {
  return TARGET_TOOLS.has(value as TargetTool) ? (value as TargetTool) : undefined;
}

function sanitizeCategory(value: unknown): TechCategory {
  return TECH_CATEGORIES.has(value as TechCategory) ? (value as TechCategory) : 'Other';
}

function buildPrompt(input: WizardEnhanceInput): string {
  const templateInfo = [
    input.templateName ? `Template: ${input.templateName}` : null,
    input.templateFeatures?.length ? `Template features: ${input.templateFeatures.join(', ')}` : null,
    input.templateScreens?.length ? `Template screens: ${input.templateScreens.join(', ')}` : null,
    input.templateTechStack?.length
      ? `Template tech stack: ${input.templateTechStack
          .map((item) => `${item.category}:${item.toolName}`)
          .join(', ')}`
      : null,
    input.templatePrompts?.length
      ? `Template prompt pack: ${input.templatePrompts.map((item) => item.text).join(' | ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const userInfo = [
    `App name: ${input.appName}`,
    `Description: ${input.description}`,
    `Target user: ${input.targetUser}`,
    `Core problem: ${input.coreProblem}`,
    input.features.length ? `User feature ideas: ${input.features.join(', ')}` : null,
    input.screens.length ? `User screen ideas: ${input.screens.join(', ')}` : null,
    `Preferred tool: ${input.tool}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    templateInfo ? `Context\n${templateInfo}` : null,
    'User input',
    userInfo,
    '',
    'Return a single JSON object with this exact shape:',
    '{',
    '"idea": {"appName": string, "description": string, "targetUser": string, "coreProblem": string},',
    '"features": [{"featureName": string, "description": string, "priority":"Must|Should|Nice", "status":"Planned|In Progress|Built|Broken|Blocked"}],',
    '"screens": [{"screenName": string, "description": string, "keyElements": string}],',
    '"techStack": [{"category":"Frontend|Backend|Database|Auth|Hosting|Other","toolName": string, "notes": string}],',
    '"prompts": [{"text": string, "targetTool":"Claude|Bolt|Cursor|Lovable|Replit|Other"}]',
    '}',
    'Rules:',
    '- Only JSON, no markdown or extra text.',
    '- Keep descriptions concise (1-2 sentences).',
    '- Use 6-12 features and 4-8 screens when possible.',
    '- Default all feature statuses to Planned.',
    '- If a field is missing in input, infer reasonable defaults.',
  ]
    .filter(Boolean)
    .join('\n');
}

function validateInput(input: WizardEnhanceInput): void {
  const combined = [
    input.appName,
    input.description,
    input.targetUser,
    input.coreProblem,
    input.features.join(' '),
    input.screens.join(' '),
  ]
    .join(' ')
    .trim();

  if (!combined) {
    throw new ValidationError('Please provide some project details before enhancing with AI.');
  }

  if (combined.length > MAX_INPUT_LENGTH) {
    throw new ValidationError('Wizard input is too long. Please shorten your entries.');
  }
}

export async function enhanceWizardAnswers(input: WizardEnhanceInput): Promise<WizardEnhanceOutput> {
  try {
    if (!isAiEnabled() || !process.env.OPENAI_API_KEY) {
      throw new ValidationError('AI wizard enhancement is disabled.');
    }

    validateInput(input);

    const headerList = await headers();
    await validateOrigin(headerList);
    const userId = await getAuthUserId();

    const identifier = `${userId}:${getClientIp(headerList)}`;
    const hourlyLimit = await checkRateLimit(wizardHourlyRateLimiter, identifier);
    if (!hourlyLimit.success) {
      throw new RateLimitError('Too many AI enhancements. Please try again later.');
    }

    const dailyLimit = await checkRateLimit(wizardDailyRateLimiter, identifier);
    if (!dailyLimit.success) {
      throw new RateLimitError('Daily AI enhancement limit reached. Please try again tomorrow.');
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: getModel(),
      input: buildPrompt(input),
      max_output_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      throw new DatabaseError('AI enhancement failed to produce output.');
    }

    const parsed = safeParseJson(outputText);

    const ideaPayload = (parsed.idea ?? {}) as Record<string, unknown>;
    const idea = {
      appName: typeof ideaPayload.appName === 'string' ? clampText(ideaPayload.appName) : clampText(input.appName),
      description:
        typeof ideaPayload.description === 'string'
          ? clampText(ideaPayload.description)
          : clampText(input.description),
      targetUser:
        typeof ideaPayload.targetUser === 'string'
          ? clampText(ideaPayload.targetUser)
          : clampText(input.targetUser),
      coreProblem:
        typeof ideaPayload.coreProblem === 'string'
          ? clampText(ideaPayload.coreProblem)
          : clampText(input.coreProblem),
    };

    const features = Array.isArray(parsed.features)
      ? (parsed.features as Record<string, unknown>[])
          .map((item) => ({
            featureName: typeof item.featureName === 'string' ? clampText(item.featureName) : '',
            description: typeof item.description === 'string' ? clampText(item.description) : '',
            priority: sanitizePriority(item.priority),
            status: sanitizeStatus(item.status),
          }))
          .filter((item) => item.featureName)
          .slice(0, MAX_FEATURES)
      : [];

    const screens = Array.isArray(parsed.screens)
      ? (parsed.screens as Record<string, unknown>[])
          .map((item) => ({
            screenName: typeof item.screenName === 'string' ? clampText(item.screenName) : '',
            description: typeof item.description === 'string' ? clampText(item.description) : '',
            keyElements: typeof item.keyElements === 'string' ? clampText(item.keyElements) : '',
          }))
          .filter((item) => item.screenName)
          .slice(0, MAX_SCREENS)
      : [];

    const techStack = Array.isArray(parsed.techStack)
      ? (parsed.techStack as Record<string, unknown>[])
          .map((item) => ({
            category: sanitizeCategory(item.category),
            toolName: typeof item.toolName === 'string' ? clampText(item.toolName) : '',
            notes: typeof item.notes === 'string' ? clampText(item.notes) : '',
          }))
          .filter((item) => item.toolName)
          .slice(0, MAX_TECH)
      : [];

    const prompts = Array.isArray(parsed.prompts)
      ? (parsed.prompts as Record<string, unknown>[])
          .map((item) => ({
            text: typeof item.text === 'string' ? clampText(item.text) : '',
            targetTool: sanitizeTool(item.targetTool),
          }))
          .filter((item) => item.text)
          .slice(0, MAX_PROMPTS)
      : [];

    return {
      idea,
      features: features.length ? features : clampList(input.features, MAX_FEATURES).map((featureName) => ({
        featureName,
        description: '',
        priority: 'Must',
        status: 'Planned',
      })),
      screens: screens.length ? screens : clampList(input.screens, MAX_SCREENS).map((screenName) => ({
        screenName,
        description: '',
        keyElements: '',
      })),
      techStack,
      prompts,
    };
  } catch (error) {
    logError(error, { action: 'enhanceWizardAnswers' });
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof RateLimitError ||
      error instanceof DatabaseError
    ) {
      throw error;
    }
    throw new DatabaseError('Failed to enhance wizard answers.');
  }
}
