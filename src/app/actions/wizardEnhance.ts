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
  FeatureEffort,
  TargetTool,
  TechCategory,
} from '@/types/nodes';

const MAX_INPUT_LENGTH = 25000;
const MAX_OUTPUT_TOKENS = 8000; // Increased to 8000 to prevent JSON truncation
const MAX_FEATURES = 15;
const MAX_SCREENS = 15;
const MAX_PROMPTS = 8;
const MAX_TECH = 10;
const MAX_TEXT_FIELD = 320;

const FEATURE_PRIORITIES = new Set<FeaturePriority>(['Must', 'Should', 'Nice']);
const FEATURE_STATUSES = new Set<FeatureStatus>(['Planned', 'In Progress', 'Built', 'Broken', 'Blocked']);
const FEATURE_EFFORTS = new Set<FeatureEffort>(['XS', 'S', 'M', 'L', 'XL']);
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
    projectArchitecture: string;
    corePatterns: string[];
    constraints: string[];
  };
  features: {
    featureName: string;
    summary: string;
    problem: string;
    userStory: string;
    acceptanceCriteria: string[];
    priority: FeaturePriority;
    status: FeatureStatus;
    effort: FeatureEffort;
    dependencies: string[];
    risks: string;
    metrics: string;
    notes: string;
    aiContext: string;
    implementationSteps: string[];
    codeReferences: string[];
    testingRequirements: string;
    relatedFiles: string[];
    technicalConstraints: string;
  }[];
  screens: {
    screenName: string;
    purpose: string;
    keyElements: string[];
    userActions: string[];
    states: string[];
    navigation: string;
    dataSources: string[];
    wireframeUrl: string;
    notes: string;
    aiContext: string;
    acceptanceCriteria: string[];
    componentHierarchy: string[];
    codeReferences: string[];
    testingRequirements: string;
  }[];
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

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Log detailed error info for debugging
    console.error('JSON Parse Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payloadLength: payload.length,
      payloadPreview: payload.substring(0, 200),
      payloadEnd: payload.substring(Math.max(0, payload.length - 200)),
    });
    throw error;
  }
}

function sanitizePriority(value: unknown): FeaturePriority {
  return FEATURE_PRIORITIES.has(value as FeaturePriority) ? (value as FeaturePriority) : 'Must';
}

function sanitizeStatus(value: unknown): FeatureStatus {
  return FEATURE_STATUSES.has(value as FeatureStatus) ? (value as FeatureStatus) : 'Planned';
}

function sanitizeEffort(value: unknown): FeatureEffort {
  return FEATURE_EFFORTS.has(value as FeatureEffort) ? (value as FeatureEffort) : 'M';
}

function sanitizeTool(value: unknown): TargetTool | undefined {
  return TARGET_TOOLS.has(value as TargetTool) ? (value as TargetTool) : undefined;
}

function sanitizeCategory(value: unknown): TechCategory {
  return TECH_CATEGORIES.has(value as TechCategory) ? (value as TechCategory) : 'Other';
}

/**
 * Validates that a feature has minimum quality requirements met.
 * Filters out features that are too sparse or incomplete.
 */
function validateFeatureQuality(feature: {
  featureName: string;
  summary: string;
  acceptanceCriteria: string[];
  userStory: string;
}): boolean {
  return (
    feature.featureName.length > 0 &&
    feature.summary.length > 10 &&
    Array.isArray(feature.acceptanceCriteria) &&
    feature.acceptanceCriteria.length >= 2 &&
    feature.acceptanceCriteria.every((criterion) => criterion.length > 5) &&
    feature.userStory.length > 15
  );
}

/**
 * Validates that a screen has minimum quality requirements met.
 * Filters out screens that lack sufficient detail.
 */
function validateScreenQuality(screen: {
  screenName: string;
  keyElements: string[];
  userActions: string[];
  states: string[];
}): boolean {
  return (
    screen.screenName.length > 0 &&
    Array.isArray(screen.keyElements) &&
    screen.keyElements.length >= 4 &&
    screen.keyElements.every((element) => element.length > 2) &&
    Array.isArray(screen.userActions) &&
    screen.userActions.length >= 3 &&
    Array.isArray(screen.states) &&
    screen.states.length >= 2
  );
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
    'You are an expert product architect helping to structure software specifications for AI coding tools.',
    '',
    templateInfo ? `CONTEXT\n${templateInfo}\n` : null,
    'USER INPUT',
    userInfo,
    '',
    '=== EXAMPLE OF QUALITY OUTPUT ===',
    '',
    'Feature Example:',
    '{',
    '  "featureName": "User Authentication",',
    '  "summary": "Secure user login and registration with email verification and password reset.",',
    '  "problem": "Users need a secure way to access their personal data without sharing accounts.",',
    '  "userStory": "As a new user, I want to create an account with my email so that I can securely save and access my project data.",',
    '  "acceptanceCriteria": [',
    '    "User can register with email and password (min 8 chars, 1 uppercase, 1 number)",',
    '    "Email verification link sent within 1 minute of registration",',
    '    "User can login with verified email and correct password",',
    '    "Failed login attempts show clear error messages",',
    '    "Password reset email delivered within 2 minutes of request"',
    '  ],',
    '  "priority": "Must",',
    '  "status": "Planned",',
    '  "effort": "M",',
    '  "dependencies": ["Database Setup", "Email Service Integration"],',
    '  "risks": "Email deliverability issues may delay verification. Mitigation: Use reputable email service (SendGrid) and implement retry logic.",',
    '  "metrics": "Track: registration completion rate, email verification rate, login success rate, time to first login.",',
    '  "implementationSteps": [',
    '    "Set up user table with email, hashed password, verified flag",',
    '    "Create registration API endpoint with password validation",',
    '    "Implement email verification token generation and storage",',
    '    "Build email template and send verification emails",',
    '    "Create login endpoint with bcrypt password comparison",',
    '    "Add password reset flow with time-limited tokens"',
    '  ]',
    '}',
    '',
    'Screen Example:',
    '{',
    '  "screenName": "Login Screen",',
    '  "purpose": "Allow existing users to securely access their account.",',
    '  "keyElements": [',
    '    "Email input field with validation",',
    '    "Password input field with show/hide toggle",',
    '    "Remember me checkbox",',
    '    "Login button (primary CTA)",',
    '    "Forgot password link",',
    '    "Create account link",',
    '    "Error message banner",',
    '    "Loading spinner during authentication"',
    '  ],',
    '  "userActions": [',
    '    "Enter email address",',
    '    "Enter password",',
    '    "Toggle password visibility",',
    '    "Check remember me option",',
    '    "Click login button",',
    '    "Click forgot password link",',
    '    "Click create account link"',
    '  ],',
    '  "states": [',
    '    "empty - no data entered",',
    '    "loading - authentication in progress",',
    '    "error - invalid credentials or network error",',
    '    "success - redirect to dashboard",',
    '    "validation error - show field-level errors"',
    '  ],',
    '  "navigation": "On success: navigate to /dashboard. Forgot password links to /reset-password. Create account links to /register.",',
    '  "dataSources": ["Auth API POST /api/auth/login", "Session storage for remember me token"]',
    '}',
    '',
    '=== FIELD-BY-FIELD REQUIREMENTS ===',
    '',
    'FEATURES - Each feature must have:',
    '• acceptanceCriteria: 3-5 items, EACH item must be specific, testable, and measurable (not vague like "works well")',
    '• userStory: MUST follow format "As a [specific persona], I want [specific action] so that [clear benefit]"',
    '• dependencies: List OTHER features from this spec that must be completed first (use exact feature names)',
    '• risks: 1-2 realistic technical/UX/business risks + brief mitigation strategy (not generic)',
    '• effort: Use sizing guide - XS=<1 day, S=1-3 days, M=3-7 days, L=1-2 weeks, XL=2+ weeks',
    '• implementationSteps: 4-6 concrete, ordered steps (not "implement feature" - be specific)',
    '• metrics: Define 2-4 measurable KPIs to track feature success',
    '',
    'SCREENS - Each screen must have:',
    '• keyElements: 6-10 specific UI components (NOT "form" or "navigation" - list each input, button, link)',
    '• userActions: 5-8 specific actions users can take (verbs: click, enter, select, drag, upload)',
    '• states: 4-6 distinct UI states (ALWAYS include: loading, error, success, empty. Consider: filtered, editing, disabled)',
    '• navigation: Describe what happens on user actions and where they navigate to',
    '• dataSources: List specific API endpoints or data stores used by this screen',
    '',
    '=== OUTPUT JSON SCHEMA ===',
    '',
    '{',
    '  "idea": {',
    '    "appName": string,',
    '    "description": string,',
    '    "targetUser": string,',
    '    "coreProblem": string,',
    '    "projectArchitecture": string,',
    '    "corePatterns": string[],',
    '    "constraints": string[]',
    '  },',
    '  "features": [{',
    '    "featureName": string,',
    '    "summary": string,',
    '    "problem": string,',
    '    "userStory": string,',
    '    "acceptanceCriteria": string[],',
    '    "priority": "Must|Should|Nice",',
    '    "status": "Planned|In Progress|Built|Broken|Blocked",',
    '    "effort": "XS|S|M|L|XL",',
    '    "dependencies": string[],',
    '    "risks": string,',
    '    "metrics": string,',
    '    "notes": string,',
    '    "aiContext": string,',
    '    "implementationSteps": string[],',
    '    "codeReferences": string[],',
    '    "testingRequirements": string,',
    '    "relatedFiles": string[],',
    '    "technicalConstraints": string',
    '  }],',
    '  "screens": [{',
    '    "screenName": string,',
    '    "purpose": string,',
    '    "keyElements": string[],',
    '    "userActions": string[],',
    '    "states": string[],',
    '    "navigation": string,',
    '    "dataSources": string[],',
    '    "wireframeUrl": string,',
    '    "notes": string,',
    '    "aiContext": string,',
    '    "acceptanceCriteria": string[],',
    '    "componentHierarchy": string[],',
    '    "codeReferences": string[],',
    '    "testingRequirements": string',
    '  }],',
    '  "techStack": [{"category":"Frontend|Backend|Database|Auth|Hosting|Other","toolName": string, "notes": string}],',
    '  "prompts": [{"text": string (2-4 sentence actionable description), "targetTool":"Claude|Bolt|Cursor|Lovable|Replit|Other"}]',
    '}',
    '',
    '=== PROMPT QUALITY REQUIREMENTS ===',
    '',
    'Each prompt in the "prompts" array must be 2-4 sentences that describe:',
    '1. WHAT to build (specific components, schemas, or flows)',
    '2. WHICH data/features are involved (reference specific features by name)',
    '3. HOW it connects to other parts of the system',
    '',
    'BAD prompt: "Generate the core data models"',
    'GOOD prompt: "Set up the database schema and tables for users, teams, and subscriptions. Include row-level security policies for team-scoped access. Create TypeScript types matching each table and a seed script for development data."',
    '',
    'Order prompts in logical build sequence: data layer → auth → core features → UI/screens → polish/testing.',
    'Generate 3-5 prompts that together cover the full project build.',
    '',
    'CRITICAL RULES:',
    '1. Return ONLY valid JSON, no markdown blocks or explanatory text',
    '2. Generate 6-12 features and 4-8 screens',
    '3. Every feature MUST have 3+ acceptance criteria (specific and testable)',
    '4. Every screen MUST have 6+ keyElements (list each component separately)',
    '5. All feature statuses default to "Planned"',
    '6. Use user input to infer tech stack and suggest appropriate prompts',
    '7. Make dependencies realistic - only list features that logically must come first',
    '8. Write clear, actionable implementation steps - avoid vague descriptions',
    '9. Each prompt text MUST be 2-4 sentences — never a single sentence',
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
    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only assistant. Return ONLY valid JSON with no markdown, explanations, or additional text.',
        },
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' }, // Force valid JSON output
    });

    const outputText = response.choices[0]?.message?.content?.trim();
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
      projectArchitecture:
        typeof ideaPayload.projectArchitecture === 'string' ? clampText(ideaPayload.projectArchitecture) : '',
      corePatterns: Array.isArray(ideaPayload.corePatterns) ? clampList(ideaPayload.corePatterns as string[], 10) : [],
      constraints: Array.isArray(ideaPayload.constraints) ? clampList(ideaPayload.constraints as string[], 10) : [],
    };

    const features = Array.isArray(parsed.features)
      ? (parsed.features as Record<string, unknown>[])
          .map((item) => ({
            featureName: typeof item.featureName === 'string' ? clampText(item.featureName) : '',
            summary: typeof item.summary === 'string' ? clampText(item.summary) : '',
            problem: typeof item.problem === 'string' ? clampText(item.problem) : '',
            userStory: typeof item.userStory === 'string' ? clampText(item.userStory) : '',
            acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
              ? clampList(item.acceptanceCriteria as string[], 8)
              : [],
            priority: sanitizePriority(item.priority),
            status: sanitizeStatus(item.status),
            effort: sanitizeEffort(item.effort),
            dependencies: Array.isArray(item.dependencies) ? clampList(item.dependencies as string[], 8) : [],
            risks: typeof item.risks === 'string' ? clampText(item.risks) : '',
            metrics: typeof item.metrics === 'string' ? clampText(item.metrics) : '',
            notes: typeof item.notes === 'string' ? clampText(item.notes) : '',
            aiContext: typeof item.aiContext === 'string' ? clampText(item.aiContext) : '',
            implementationSteps: Array.isArray(item.implementationSteps)
              ? clampList(item.implementationSteps as string[], 12)
              : [],
            codeReferences: Array.isArray(item.codeReferences)
              ? clampList(item.codeReferences as string[], 8)
              : [],
            testingRequirements: typeof item.testingRequirements === 'string' ? clampText(item.testingRequirements) : '',
            relatedFiles: Array.isArray(item.relatedFiles) ? clampList(item.relatedFiles as string[], 10) : [],
            technicalConstraints: typeof item.technicalConstraints === 'string' ? clampText(item.technicalConstraints) : '',
          }))
          .filter((item) => item.featureName && validateFeatureQuality(item))
          .slice(0, MAX_FEATURES)
      : [];

    const screens = Array.isArray(parsed.screens)
      ? (parsed.screens as Record<string, unknown>[])
          .map((item) => ({
            screenName: typeof item.screenName === 'string' ? clampText(item.screenName) : '',
            purpose: typeof item.purpose === 'string' ? clampText(item.purpose) : '',
            keyElements: Array.isArray(item.keyElements) ? clampList(item.keyElements as string[], 10) : [],
            userActions: Array.isArray(item.userActions) ? clampList(item.userActions as string[], 8) : [],
            states: Array.isArray(item.states) ? clampList(item.states as string[], 6) : [],
            navigation: typeof item.navigation === 'string' ? clampText(item.navigation) : '',
            dataSources: Array.isArray(item.dataSources) ? clampList(item.dataSources as string[], 8) : [],
            wireframeUrl: typeof item.wireframeUrl === 'string' ? clampText(item.wireframeUrl) : '',
            notes: typeof item.notes === 'string' ? clampText(item.notes) : '',
            aiContext: typeof item.aiContext === 'string' ? clampText(item.aiContext) : '',
            acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
              ? clampList(item.acceptanceCriteria as string[], 8)
              : [],
            componentHierarchy: Array.isArray(item.componentHierarchy)
              ? clampList(item.componentHierarchy as string[], 10)
              : [],
            codeReferences: Array.isArray(item.codeReferences) ? clampList(item.codeReferences as string[], 8) : [],
            testingRequirements: typeof item.testingRequirements === 'string' ? clampText(item.testingRequirements) : '',
          }))
          .filter((item) => item.screenName && validateScreenQuality(item))
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
        summary: '',
        problem: '',
        userStory: '',
        acceptanceCriteria: [],
        priority: 'Must',
        status: 'Planned',
        effort: 'M',
        dependencies: [],
        risks: '',
        metrics: '',
        notes: '',
        aiContext: '',
        implementationSteps: [],
        codeReferences: [],
        testingRequirements: '',
        relatedFiles: [],
        technicalConstraints: '',
      })),
      screens: screens.length
        ? screens
        : clampList(input.screens, MAX_SCREENS).map((screenName) => ({
            screenName,
            purpose: '',
            keyElements: [],
            userActions: [],
            states: [],
            navigation: '',
            dataSources: [],
            wireframeUrl: '',
            notes: '',
            aiContext: '',
            acceptanceCriteria: [],
            componentHierarchy: [],
            codeReferences: [],
            testingRequirements: '',
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
