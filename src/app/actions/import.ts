'use server';

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateCanvas } from '@/lib/generateCanvas';
import { parseDocumentToCanvas } from '@/lib/import/documentImport';
import { extractDetailedFields } from '@/lib/import/aiDetailExtractor';
import { matchExtractedToExisting } from '@/lib/import/fuzzyMatcher';
import { buildFieldUpdate } from '@/lib/import/mergeStrategy';
import { ClaudeAI } from '@/lib/ai/claude';
import { batchEnhanceFeatures, batchEnhanceScreens } from './batchEnhanceNodes';
import {
  FEATURE_TEMPLATES,
  GENERIC_FEATURES,
  TECH_TEMPLATES,
  DEFAULT_TECH_STACK,
} from '@/config/import-defaults';
import type {
  SpexlyNode,
  SpexlyEdge,
  TechCategory,
  TargetTool,
  NoteNodeData,
  IdeaNodeData,
  ExistingNodeSummary,
  NodeFieldUpdate,
  SmartImportResult,
  SmartImportSummary,
  SpexlyNodeType,
} from '@/types/nodes';
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  DatabaseError,
  logError,
} from '@/lib/errors';
import {
  checkRateLimit,
  importDailyRateLimiter,
  importHourlyRateLimiter,
  getClientIp,
} from '@/lib/rate-limit/limiter';

const MAX_INPUT_LENGTH = 25_000;
const MAX_OUTPUT_TOKENS = 4500; // Increased from 800 to support detailed field extraction
const MAX_FEATURES = 20;
const MAX_SCREENS = 20;
const MAX_TECH = 10;
const MAX_PROMPTS = 10;
const MAX_TEXT_FIELD = 400;
const DAILY_DB_LIMIT = 10;

function isAiEnabled(): boolean {
  return process.env.AI_IMPORT_ENABLED === 'true';
}

function isFallbackEnabled(): boolean {
  return process.env.AI_IMPORT_FALLBACK_ENABLED === 'true';
}

function shouldUseClaudeForImport(): boolean {
  return process.env.AI_USE_CLAUDE_FOR_IMPORT === 'true';
}

function normalizeModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return 'gpt-4.1-mini';
  if (trimmed === '4.1-mini') return 'gpt-4.1-mini';
  if (trimmed === '4.1') return 'gpt-4.1';
  return trimmed;
}

function getModel(): string {
  return normalizeModel(process.env.OPENAI_MODEL || 'gpt-4.1-mini');
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

function clampPrompts(values: { text: string; targetTool?: TargetTool }[]): { text: string; targetTool?: TargetTool }[] {
  return values
    .filter((item) => item.text)
    .map((item) => ({ text: clampText(item.text), targetTool: item.targetTool }))
    .slice(0, MAX_PROMPTS);
}

function clampTechStack(values: { category: TechCategory; toolName: string; notes?: string }[]) {
  return values
    .filter((item) => item.toolName)
    .map((item) => ({
      category: item.category,
      toolName: clampText(item.toolName),
      notes: item.notes ? clampText(item.notes) : '',
    }))
    .slice(0, MAX_TECH);
}

/**
 * Infer basic features from description when AI extraction fails.
 * Returns a list of common features based on keywords in the description.
 * Uses customizable templates from /src/config/import-defaults.ts
 */
function inferFeaturesFromDescription(
  description: string,
  coreProblem: string,
  targetUser: string
): string[] {
  const text = `${description} ${coreProblem} ${targetUser}`.toLowerCase();
  const features: string[] = [];

  // Check against customizable feature templates
  for (const pattern of FEATURE_TEMPLATES) {
    if (pattern.keywords.some((kw) => text.includes(kw))) {
      features.push(pattern.feature);
    }
  }

  // If still no features, add generic ones from config
  if (features.length === 0) {
    features.push(...GENERIC_FEATURES);
  }

  return features.slice(0, 8); // Max 8 features
}

/**
 * Infer tech stack from document content when AI extraction fails.
 * Detects technology mentions and provides smart defaults.
 * Uses customizable templates from /src/config/import-defaults.ts
 */
function inferTechStackFromDocument(text: string, description: string): Array<{
  category: TechCategory;
  toolName: string;
  notes: string;
}> {
  const combined = `${text} ${description}`.toLowerCase();
  const stack: Array<{ category: TechCategory; toolName: string; notes: string }> = [];

  // Detect mentioned technologies using customizable templates
  for (const pattern of TECH_TEMPLATES) {
    if (pattern.keywords.some((kw) => combined.includes(kw))) {
      stack.push(pattern.tech);
    }
  }

  // If no tech detected, use defaults from config
  if (stack.length === 0) {
    stack.push(...DEFAULT_TECH_STACK);
  }

  return stack;
}

function safeParseJson(payload: string): Record<string, unknown> {
  const cleaned = payload
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

function getClientIdentifier(email: string, headerList: Headers): string {
  const ip = getClientIp(headerList);
  return `${email.toLowerCase()}:${ip}`;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeStatus = (error as { status?: number }).status;
  if (maybeStatus === 429) return true;
  const message = (error as { message?: string }).message || '';
  return message.includes('quota') || message.includes('429');
}

async function checkDailyUsage(supabase: SupabaseClient, userId: string) {
  const usageDate = getTodayDate();
  const { data, error } = await supabase
    .from('import_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', usageDate)
    .single();

  if (error && error.code !== 'PGRST116') {
    logError(error, { action: 'importDocumentWithAI:checkDailyUsage', userId });
    return;
  }

  if (data?.count && data.count >= DAILY_DB_LIMIT) {
    throw new RateLimitError('Daily import limit reached. Please try again tomorrow.');
  }
}

async function incrementDailyUsageCount(supabase: SupabaseClient, userId: string) {
  const usageDate = getTodayDate();
  const { data, error } = await supabase
    .from('import_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', usageDate)
    .single();

  if (error && error.code !== 'PGRST116') {
    logError(error, { action: 'importDocumentWithAI:incrementDailyUsageCount', userId });
    return;
  }

  const nextCount = (data?.count ?? 0) + 1;

  const { error: updateError } = await supabase
    .from('import_usage')
    .upsert(
      {
        user_id: userId,
        usage_date: usageDate,
        count: nextCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,usage_date' }
    );

  if (updateError) {
    logError(updateError, { action: 'importDocumentWithAI:incrementDailyUsageCount', userId });
  }
}

async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    inputChars: number;
    model: string;
    success: boolean;
    errorMessage?: string;
    outputNodes?: number;
    outputEdges?: number;
  }
) {
  const { error } = await supabase
    .from('import_audit')
    .insert({
      user_id: userId,
      input_chars: payload.inputChars,
      model: payload.model,
      success: payload.success,
      error_message: payload.errorMessage ?? null,
      output_nodes: payload.outputNodes ?? 0,
      output_edges: payload.outputEdges ?? 0,
    });

  if (error) {
    logError(error, { action: 'importDocumentWithAI:logAudit', userId });
  }
}

export type ImportMode = 'ai' | 'fallback';

export async function importDocumentWithAI(
  text: string
): Promise<{ nodes: SpexlyNode[]; edges: SpexlyEdge[]; mode: ImportMode }> {
  let supabase: SupabaseClient | null = null;
  let userId: string | null = null;
  try {
    const headerList = await headers();
    await validateOrigin(headerList);

    if (!text || text.trim().length === 0) {
      throw new ValidationError('Document text is required.');
    }

    if (text.length > MAX_INPUT_LENGTH) {
      throw new ValidationError(`Document is too long. Max ${MAX_INPUT_LENGTH} characters.`);
    }

    userId = await getAuthUserId();
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email || userId;

    const identifier = getClientIdentifier(email, headerList);

    const hourly = await checkRateLimit(importHourlyRateLimiter, identifier);
    if (!hourly.success) {
      throw new RateLimitError('Too many imports. Please try again later.');
    }

    const daily = await checkRateLimit(importDailyRateLimiter, identifier);
    if (!daily.success) {
      throw new RateLimitError('Daily import limit reached. Please try again tomorrow.');
    }

    await checkDailyUsage(supabase, userId);

    if (!isAiEnabled() || !process.env.OPENAI_API_KEY) {
      if (!isFallbackEnabled()) {
        throw new ValidationError('AI import is currently disabled.');
      }

      const fallback = parseDocumentToCanvas(text);
      await incrementDailyUsageCount(supabase, userId);
      await logAudit(supabase, userId, {
        inputChars: text.length,
        model: 'rule-based',
        success: true,
        outputNodes: fallback.nodes.length,
        outputEdges: fallback.edges.length,
      });
      return { ...fallback, mode: 'fallback' };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = [
      'You are an assistant that extracts structured project data from PRDs.',
      'Return ONLY valid JSON. No markdown.',
      'Use the schema exactly.',
    ].join(' ');

    const prompt = [
      'Extract structured fields from the document below.',
      '',
      '=== CRITICAL EXTRACTION RULES ===',
      '',
      'FEATURES:',
      '- If explicit "Features" section exists, extract all listed features',
      '- If NO explicit section, INFER features from:',
      '  • Requirements sections (each requirement = 1 feature)',
      '  • "User needs to..." statements (each = 1 feature)',
      '  • Functional capabilities described (e.g., "authentication", "dashboard", "reporting")',
      '  • ANY action the app performs for users',
      '- Give each feature a clear, concise name (2-5 words)',
      '- ALWAYS extract at least 3-5 features unless document is truly feature-less',
      '',
      'SCREENS:',
      '- Extract any mentioned UI screens, pages, views, or interfaces',
      '- Infer screens from features (e.g., "user login" → "Login Screen")',
      '- Infer screens from user flows (e.g., "dashboard" → "Dashboard Screen")',
      '',
      'TECH STACK:',
      '- Extract ANY technology, framework, library, or tool mentioned',
      '- Examples: React, Node.js, PostgreSQL, AWS, Tailwind, Next.js, Supabase',
      '- Categorize as: Frontend, Backend, Database, Auth, Hosting, or Other',
      '- If document mentions "web app" with no stack, infer common stack (React, Node, PostgreSQL)',
      '',
      'PROMPTS:',
      '- Generate 3-5 actionable coding prompts that cover the full build of this project',
      '- Each prompt should be 2-4 sentences describing WHAT to build, WHICH components/data are involved, and HOW it connects to other parts',
      '- Order prompts in logical build sequence (data layer first, then core features, then UI polish)',
      '- BAD prompt: "Generate the core data models"',
      '- GOOD prompt: "Set up the database schema and tables for users, teams, and subscriptions. Include row-level security policies for team-scoped access. Create TypeScript types matching each table and a seed script for development data."',
      '',
      'JSON SCHEMA:',
      '{',
      '  "appName": string,',
      '  "description": string (1-2 sentence summary),',
      '  "targetUser": string (who will use this app),',
      '  "coreProblem": string (what problem it solves),',
      '  "features": string[] (feature names, min 3-5),',
      '  "screens": string[] (screen/page names),',
      '  "techStack": [{"category":"Frontend|Backend|Database|Auth|Hosting|Other","toolName": string, "notes": string}],',
      '  "prompts": [{"text": string (2-4 sentence description, NOT a one-liner), "targetTool":"Claude|Bolt|Cursor|Lovable|Replit|Other"}],',
      '  "notes": string[] (any additional context)',
      '}',
      '',
      'CRITICAL: Be AGGRESSIVE about inferring features and tech stack. Extract everything mentioned.',
      'CRITICAL: Each prompt text MUST be 2-4 sentences, specific and actionable — never a single sentence.',
      'Return ONLY valid JSON, no markdown or explanatory text.',
      '',
      '=== DOCUMENT ===',
      text,
    ].join('\n');

    let outputText: string | undefined;
    try {
      const response = await client.chat.completions.create({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content: system,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
      });
      outputText = response.choices[0]?.message?.content?.trim();
    } catch (aiError) {
      if (isFallbackEnabled()) {
        const fallback = parseDocumentToCanvas(text);
        await incrementDailyUsageCount(supabase, userId);
        await logAudit(supabase, userId, {
          inputChars: text.length,
          model: 'rule-based-fallback',
          success: true,
          outputNodes: fallback.nodes.length,
          outputEdges: fallback.edges.length,
          errorMessage: aiError instanceof Error ? aiError.message : 'AI import failed',
        });
        return { ...fallback, mode: 'fallback' };
      }

      if (isQuotaError(aiError)) {
        throw new RateLimitError('AI quota exceeded. Please check billing or try again later.');
      }

      throw aiError;
    }

    if (!outputText) {
      throw new DatabaseError('AI import failed to produce output.');
    }

    const parsed = safeParseJson(outputText);

    const appName = typeof parsed.appName === 'string' ? clampText(parsed.appName) : '';
    const description = typeof parsed.description === 'string' ? clampText(parsed.description) : '';
    const targetUser = typeof parsed.targetUser === 'string' ? clampText(parsed.targetUser) : '';
    const coreProblem = typeof parsed.coreProblem === 'string' ? clampText(parsed.coreProblem) : '';
    const features = Array.isArray(parsed.features) ? clampList(parsed.features as string[], MAX_FEATURES) : [];
    const screens = Array.isArray(parsed.screens) ? clampList(parsed.screens as string[], MAX_SCREENS) : [];
    const prompts = Array.isArray(parsed.prompts)
      ? clampPrompts(parsed.prompts as { text: string; targetTool?: TargetTool }[])
      : [];
    const techStack = Array.isArray(parsed.techStack)
      ? clampTechStack(parsed.techStack as { category: TechCategory; toolName: string; notes?: string }[])
      : [];
    const notes = Array.isArray(parsed.notes) ? clampList(parsed.notes as string[], 10) : [];

    // Smart defaults: If AI didn't find features/tech stack, infer from document type
    let finalFeatures = features;
    let finalTechStack = techStack;

    // If no features extracted, try to infer basic features from description
    if (finalFeatures.length === 0 && description.length > 0) {
      finalFeatures = inferFeaturesFromDescription(description, coreProblem, targetUser);
    }

    // If no tech stack extracted, use smart defaults based on document hints
    if (finalTechStack.length === 0) {
      finalTechStack = inferTechStackFromDocument(text, description);
    }

    // Stage 2: Extract detailed fields for features and screens
    let featuresDetailed: Awaited<ReturnType<typeof extractDetailedFields>>['features'] | undefined;
    let screensDetailed: Awaited<ReturnType<typeof extractDetailedFields>>['screens'] | undefined;

    if (finalFeatures.length > 0 || screens.length > 0) {
      try {
        // Use Claude API if enabled (better structured output, prompt caching)
        if (shouldUseClaudeForImport() && process.env.ANTHROPIC_API_KEY) {
          const claude = new ClaudeAI(process.env.ANTHROPIC_API_KEY);
          const detailed = await claude.extractDetailedFields(finalFeatures, screens, text);
          featuresDetailed = detailed.features;
          screensDetailed = detailed.screens;
        } else {
          // Use OpenAI (default)
          const detailed = await extractDetailedFields(
            finalFeatures,
            screens,
            text,
            process.env.OPENAI_API_KEY!,
            getModel()
          );
          featuresDetailed = detailed.features;
          screensDetailed = detailed.screens;
        }
      } catch (detailError) {
        // Log error but continue with basic feature/screen names (graceful fallback)
        logError(detailError, { action: 'importDocumentWithAI:extractDetailedFields' });
      }
    }

    const { nodes, edges } = generateCanvas({
      description,
      targetUser,
      coreProblem,
      features: featuresDetailed && featuresDetailed.length > 0 ? [] : finalFeatures,
      screens: screensDetailed && screensDetailed.length > 0 ? [] : screens,
      featuresDetailed,
      screensDetailed,
      tool: 'Claude',
      techStack: finalTechStack,
      prompts,
    });

    const ts = Date.now();
    const ideaNode = nodes.find((node) => node.type === 'idea');
    if (ideaNode) {
      ideaNode.data = {
        ...(ideaNode.data as IdeaNodeData),
        appName,
      } as IdeaNodeData;
    }

    const sourceExcerpt = text.trim().slice(0, 2000);
    const noteBody = notes.length > 0 ? `${sourceExcerpt}\n\nNotes:\n${notes.join('\n')}` : sourceExcerpt;

    const noteNode: SpexlyNode = {
      id: `note-import-${ts}`,
      type: 'note',
      position: {
        x: (ideaNode?.position.x ?? 0) - 320,
        y: (ideaNode?.position.y ?? 0) + 180,
      },
      data: {
        title: 'Imported Document',
        body: noteBody,
        colorTag: 'Slate',
        expanded: false,
        completed: false,
      } as NoteNodeData,
    };

    nodes.push(noteNode);
    if (ideaNode) {
      edges.push({
        id: `e-${noteNode.id}-${ideaNode.id}`,
        source: noteNode.id,
        target: ideaNode.id,
      });
    }

    // Auto-enhance Feature and Screen nodes with AI context (if enabled)
    // DISABLED BY DEFAULT - Users can manually click "Generate with AI" on each node
    const autoEnhance = process.env.AI_AUTO_ENHANCE_ON_IMPORT === 'true'; // Disabled by default
    if (autoEnhance && (featuresDetailed || screensDetailed)) {
      try {
        const featureNodes = nodes.filter((n) => n.type === 'feature');
        const screenNodes = nodes.filter((n) => n.type === 'screen');

        // Only enhance if we have a reasonable number of nodes (prevent API overload)
        const maxNodesToEnhance = 10;
        const shouldEnhanceFeatures = featureNodes.length > 0 && featureNodes.length <= maxNodesToEnhance && featuresDetailed;
        const shouldEnhanceScreens = screenNodes.length > 0 && screenNodes.length <= maxNodesToEnhance && screensDetailed;

        // Batch enhance features
        if (shouldEnhanceFeatures && featuresDetailed) {
          const featureEnhancements = await batchEnhanceFeatures(
            featuresDetailed.map((f, idx) => ({
              nodeId: featureNodes[idx]?.id ?? `feature-${idx}`,
              featureName: f.featureName,
              summary: f.summary,
              problem: f.problem,
              userStory: f.userStory,
              acceptanceCriteria: f.acceptanceCriteria,
              technicalConstraints: '',
            }))
          );

          // Apply enhancements to nodes
          featureEnhancements.forEach((enhancement, idx) => {
            if (enhancement.success && enhancement.data && featureNodes[idx]) {
              featureNodes[idx].data = {
                ...featureNodes[idx].data,
                ...enhancement.data,
              };
            }
          });
        }

        // Batch enhance screens
        if (shouldEnhanceScreens && screensDetailed) {
          const screenEnhancements = await batchEnhanceScreens(
            screensDetailed.map((s, idx) => ({
              nodeId: screenNodes[idx]?.id ?? `screen-${idx}`,
              screenName: s.screenName,
              purpose: s.purpose,
              keyElements: s.keyElements,
              userActions: s.userActions,
              states: s.states,
            }))
          );

          // Apply enhancements to nodes
          screenEnhancements.forEach((enhancement, idx) => {
            if (enhancement.success && enhancement.data && screenNodes[idx]) {
              screenNodes[idx].data = {
                ...screenNodes[idx].data,
                ...enhancement.data,
              };
            }
          });
        }
      } catch (enhanceError) {
        // Log but don't fail import if enhancement fails
        logError(enhanceError, { action: 'importDocumentWithAI:autoEnhance' });
      }
    }

    await incrementDailyUsageCount(supabase, userId);
    await logAudit(supabase, userId, {
      inputChars: text.length,
      model: getModel(),
      success: true,
      outputNodes: nodes.length,
      outputEdges: edges.length,
    });

    return { nodes, edges, mode: 'ai' };
  } catch (error) {
    logError(error, {
      action: 'importDocumentWithAI',
      stage: 'catch',
      aiEnabled: isAiEnabled(),
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    });
    if (supabase && userId) {
      await logAudit(supabase, userId, {
        inputChars: text?.length ?? 0,
        model: getModel(),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof RateLimitError) {
      throw error;
    }
    logError(error, { action: 'importDocumentWithAI' });
    throw new DatabaseError('Failed to import document.');
  }
}

// ─── Smart Import ─────────────────────────────────────────

const SMART_MAX_TEXT_FIELD = 1200;

function clampTextSmart(value: string): string {
  return value.trim().slice(0, SMART_MAX_TEXT_FIELD);
}

export async function smartImportDocument(
  text: string,
  existingNodes: ExistingNodeSummary[]
): Promise<SmartImportResult> {
  let supabase: SupabaseClient | null = null;
  let userId: string | null = null;

  try {
    // ── Auth, validation, rate limiting (reuse existing helpers) ──
    const headerList = await headers();
    await validateOrigin(headerList);

    if (!text || text.trim().length === 0) {
      throw new ValidationError('Document text is required.');
    }
    if (text.length > MAX_INPUT_LENGTH) {
      throw new ValidationError(`Document is too long. Max ${MAX_INPUT_LENGTH} characters.`);
    }

    userId = await getAuthUserId();
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email || userId;
    const identifier = getClientIdentifier(email, headerList);

    const hourly = await checkRateLimit(importHourlyRateLimiter, identifier);
    if (!hourly.success) {
      throw new RateLimitError('Too many imports. Please try again later.');
    }
    const daily = await checkRateLimit(importDailyRateLimiter, identifier);
    if (!daily.success) {
      throw new RateLimitError('Daily import limit reached. Please try again tomorrow.');
    }
    await checkDailyUsage(supabase, userId);

    if (!isAiEnabled() || !process.env.OPENAI_API_KEY) {
      throw new ValidationError('AI import is currently disabled.');
    }

    // ── Stage 1: Analyzer — Extract structured data from PRD ──
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = [
      'You are an assistant that extracts structured project data from PRDs.',
      'Return ONLY valid JSON. No markdown.',
      'Use the schema exactly.',
    ].join(' ');

    const analyzerPrompt = [
      'Extract structured fields from the document below.',
      '',
      '=== CRITICAL EXTRACTION RULES ===',
      '',
      'FEATURES:',
      '- If explicit "Features" section exists, extract all listed features',
      '- If NO explicit section, INFER features from requirements, user needs, capabilities',
      '- Give each feature a clear, concise name (2-5 words)',
      '- ALWAYS extract at least 3-5 features unless document is truly feature-less',
      '',
      'SCREENS:',
      '- Extract any mentioned UI screens, pages, views, or interfaces',
      '- Infer screens from features and user flows',
      '',
      'TECH STACK:',
      '- Extract ANY technology, framework, library, or tool mentioned',
      '- Categorize as: Frontend, Backend, Database, Auth, Hosting, or Other',
      '',
      'Do NOT generate prompt or note nodes.',
      '',
      'JSON SCHEMA:',
      '{',
      '  "appName": string,',
      '  "description": string (1-2 sentence summary),',
      '  "targetUser": string (who will use this app),',
      '  "coreProblem": string (what problem it solves),',
      '  "features": string[] (feature names, min 3-5),',
      '  "screens": string[] (screen/page names),',
      '  "techStack": [{"category":"Frontend|Backend|Database|Auth|Hosting|Other","toolName": string, "notes": string}]',
      '}',
      '',
      'CRITICAL: Be AGGRESSIVE about inferring features and tech stack.',
      'Return ONLY valid JSON, no markdown or explanatory text.',
      '',
      '=== DOCUMENT ===',
      text,
    ].join('\n');

    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: analyzerPrompt },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
    });

    const outputText = response.choices[0]?.message?.content?.trim();
    if (!outputText) {
      throw new DatabaseError('AI import failed to produce output.');
    }

    const parsed = safeParseJson(outputText);

    const appName = typeof parsed.appName === 'string' ? clampTextSmart(parsed.appName) : '';
    const description = typeof parsed.description === 'string' ? clampTextSmart(parsed.description) : '';
    const targetUser = typeof parsed.targetUser === 'string' ? clampTextSmart(parsed.targetUser) : '';
    const coreProblem = typeof parsed.coreProblem === 'string' ? clampTextSmart(parsed.coreProblem) : '';
    let features = Array.isArray(parsed.features) ? clampList(parsed.features as string[], MAX_FEATURES) : [];
    const screens = Array.isArray(parsed.screens) ? clampList(parsed.screens as string[], MAX_SCREENS) : [];
    let techStack = Array.isArray(parsed.techStack)
      ? clampTechStack(parsed.techStack as { category: TechCategory; toolName: string; notes?: string }[])
      : [];

    // Smart defaults
    if (features.length === 0 && description.length > 0) {
      features = inferFeaturesFromDescription(description, coreProblem, targetUser);
    }
    if (techStack.length === 0) {
      techStack = inferTechStackFromDocument(text, description);
    }

    // ── Stage 2: Matcher — Fuzzy-match extracted items to existing nodes ──
    type ExtractedItem = { name: string; type: SpexlyNodeType };
    const extractedItems: ExtractedItem[] = [
      ...features.map((name) => ({ name, type: 'feature' as const })),
      ...screens.map((name) => ({ name, type: 'screen' as const })),
      ...techStack.map((item) => ({ name: item.toolName, type: 'techStack' as const })),
    ];

    // Add idea if we have appName
    if (appName) {
      extractedItems.unshift({ name: appName, type: 'idea' as const });
    }

    const { matches, unmatched } = matchExtractedToExisting(extractedItems, existingNodes);

    // Separate unmatched by type
    const unmatchedFeatures = unmatched.filter((item) => item.type === 'feature').map((item) => item.name);
    const unmatchedScreens = unmatched.filter((item) => item.type === 'screen').map((item) => item.name);
    const unmatchedTech = unmatched
      .filter((item) => item.type === 'techStack')
      .map((item) => {
        const original = techStack.find((t) => t.toolName === item.name);
        return original ?? { category: 'Other' as TechCategory, toolName: item.name, notes: '' };
      });

    // All feature/screen names (matched + unmatched) for detail extraction
    const allFeatureNames = features;
    const allScreenNames = screens;

    // ── Stage 3: Generator — Extract detailed fields for ALL features/screens ──
    let featuresDetailed: Awaited<ReturnType<typeof extractDetailedFields>>['features'] = [];
    let screensDetailed: Awaited<ReturnType<typeof extractDetailedFields>>['screens'] = [];

    if (allFeatureNames.length > 0 || allScreenNames.length > 0) {
      try {
        if (shouldUseClaudeForImport() && process.env.ANTHROPIC_API_KEY) {
          const claude = new ClaudeAI(process.env.ANTHROPIC_API_KEY);
          const detailed = await claude.extractDetailedFields(allFeatureNames, allScreenNames, text);
          featuresDetailed = detailed.features;
          screensDetailed = detailed.screens;
        } else {
          const detailed = await extractDetailedFields(
            allFeatureNames,
            allScreenNames,
            text,
            process.env.OPENAI_API_KEY!,
            getModel(),
            SMART_MAX_TEXT_FIELD
          );
          featuresDetailed = detailed.features;
          screensDetailed = detailed.screens;
        }
      } catch (detailError) {
        logError(detailError, { action: 'smartImportDocument:extractDetailedFields' });
      }
    }

    // ── Build NodeFieldUpdate[] for matched nodes ──
    const updates: NodeFieldUpdate[] = [];
    let fieldsFilledTotal = 0;

    for (const match of matches) {
      const existingNode = existingNodes.find((n) => n.id === match.existingNodeId);
      if (!existingNode) continue;

      let aiData: Record<string, unknown> = {};

      if (existingNode.type === 'feature') {
        const detailed = featuresDetailed.find(
          (f) => f.featureName.toLowerCase() === match.extractedName.toLowerCase()
        );
        aiData = detailed ? { ...detailed } : {};
      } else if (existingNode.type === 'screen') {
        const detailed = screensDetailed.find(
          (s) => s.screenName.toLowerCase() === match.extractedName.toLowerCase()
        );
        aiData = detailed ? { ...detailed } : {};
      } else if (existingNode.type === 'idea') {
        aiData = { description, targetUser, coreProblem, appName };
      } else if (existingNode.type === 'techStack') {
        const original = techStack.find((t) => t.toolName === match.extractedName);
        aiData = original ? { notes: original.notes, category: original.category } : {};
      }

      const update = buildFieldUpdate(
        existingNode.id,
        existingNode.type,
        existingNode.populatedFields,
        aiData
      );

      if (update) {
        updates.push(update);
        fieldsFilledTotal += Object.keys(update.fieldsToFill).length;
      }
    }

    // ── Build new nodes for unmatched items ──
    const hasExistingIdea = existingNodes.some((n) => n.type === 'idea');

    // Build detailed arrays for only unmatched items
    const unmatchedFeaturesDetailed = featuresDetailed.filter((f) =>
      unmatchedFeatures.some((name) => name.toLowerCase() === f.featureName.toLowerCase())
    );
    const unmatchedScreensDetailed = screensDetailed.filter((s) =>
      unmatchedScreens.some((name) => name.toLowerCase() === s.screenName.toLowerCase())
    );

    const { nodes: newNodes, edges: newEdges } = generateCanvas({
      appName,
      description,
      targetUser,
      coreProblem,
      features: unmatchedFeaturesDetailed.length > 0 ? [] : unmatchedFeatures,
      screens: unmatchedScreensDetailed.length > 0 ? [] : unmatchedScreens,
      featuresDetailed: unmatchedFeaturesDetailed.length > 0 ? unmatchedFeaturesDetailed : undefined,
      screensDetailed: unmatchedScreensDetailed.length > 0 ? unmatchedScreensDetailed : undefined,
      tool: 'Claude',
      techStack: unmatchedTech,
      prompts: [],
      skipIdeaNode: hasExistingIdea,
    });

    // Filter out idea node from new nodes if one already exists
    const filteredNewNodes = hasExistingIdea
      ? newNodes.filter((n) => n.type !== 'idea')
      : newNodes;

    // If idea node is new and exists, fill appName
    const newIdeaNode = filteredNewNodes.find((n) => n.type === 'idea');
    if (newIdeaNode && appName) {
      (newIdeaNode.data as IdeaNodeData).appName = appName;
    }

    // ── Build summary ──
    const summary: SmartImportSummary = {
      nodesUpdated: updates.length,
      fieldsFilledTotal,
      nodesCreated: filteredNewNodes.length,
      nodesSkipped: matches.length - updates.length,
      matchDetails: matches,
    };

    await incrementDailyUsageCount(supabase, userId);
    await logAudit(supabase, userId, {
      inputChars: text.length,
      model: getModel(),
      success: true,
      outputNodes: filteredNewNodes.length,
      outputEdges: newEdges.length,
    });

    return {
      updates,
      newNodes: filteredNewNodes,
      newEdges,
      summary,
      mode: 'smart',
    };
  } catch (error) {
    logError(error, {
      action: 'smartImportDocument',
      stage: 'catch',
      aiEnabled: isAiEnabled(),
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    });

    if (supabase && userId) {
      await logAudit(supabase, userId, {
        inputChars: text?.length ?? 0,
        model: getModel(),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof RateLimitError) {
      throw error;
    }
    logError(error, { action: 'smartImportDocument' });
    throw new DatabaseError('Failed to import document.');
  }
}
