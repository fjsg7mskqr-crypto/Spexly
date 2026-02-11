'use server';

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateCanvas } from '@/lib/generateCanvas';
import { parseDocumentToCanvas } from '@/lib/import/documentImport';
import type {
  SpexlyNode,
  SpexlyEdge,
  TechCategory,
  TargetTool,
  NoteNodeData,
  IdeaNodeData,
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

const MAX_INPUT_LENGTH = 12_000;
const MAX_OUTPUT_TOKENS = 800;
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
      'Extract structured fields from the document.',
      'Schema:',
      '{',
      '"appName": string,',
      '"description": string,',
      '"targetUser": string,',
      '"coreProblem": string,',
      '"features": string[],',
      '"screens": string[],',
      '"techStack": [{"category":"Frontend|Backend|Database|Auth|Hosting|Other","toolName": string, "notes": string}],',
      '"prompts": [{"text": string, "targetTool":"Claude|Bolt|Cursor|Lovable|Replit|Other"}],',
      '"notes": string[]',
      '}',
      'Return empty strings/arrays if not present.',
      'Document:',
      text,
    ].join('\n');

    let outputText: string | undefined;
    try {
      const response = await client.responses.create({
        model: getModel(),
        input: prompt,
        instructions: system,
        max_output_tokens: MAX_OUTPUT_TOKENS,
      });
      outputText = response.output_text?.trim();
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

    const { nodes, edges } = generateCanvas({
      description,
      targetUser,
      coreProblem,
      features,
      screens,
      tool: 'Claude',
      techStack,
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
