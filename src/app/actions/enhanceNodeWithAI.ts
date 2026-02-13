'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, logError } from '@/lib/errors';

const MAX_OUTPUT_TOKENS = 2000;

interface EnhanceFeatureInput {
  featureName: string;
  summary?: string;
  problem?: string;
  userStory?: string;
  acceptanceCriteria?: string[];
  technicalConstraints?: string;
}

interface EnhanceScreenInput {
  screenName: string;
  purpose?: string;
  keyElements?: string[];
  userActions?: string[];
  states?: string[];
}

export interface EnhancedFeatureAIContext {
  aiContext: string;
  implementationSteps: string[];
  codeReferences: string[];
  testingRequirements: string;
  relatedFiles: string[];
  technicalConstraints: string;
}

export interface EnhancedScreenAIContext {
  aiContext: string;
  componentHierarchy: string[];
  testingRequirements: string;
  codeReferences: string[];
}

/**
 * Generates AI context fields for a Feature node using OpenAI.
 * Returns implementation steps, code references, testing requirements, etc.
 */
export async function enhanceFeatureWithAI(
  input: EnhanceFeatureInput
): Promise<{ success: boolean; data?: EnhancedFeatureAIContext; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to use AI enhancement.');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured.');
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildFeatureEnhancementPrompt(input);

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a Next.js and Supabase expert helping solo developers plan feature implementation. Generate detailed, actionable guidance using Next.js 15 App Router conventions, TypeScript, Tailwind CSS, and Supabase best practices. Provide specific file paths following Next.js App Router structure.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3,
    });

    const outputText = response.choices[0]?.message?.content?.trim();
    if (!outputText) {
      throw new Error('AI enhancement failed to produce output.');
    }

    const parsed = parseFeatureEnhancement(outputText);

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    logError(error, { action: 'enhanceFeatureWithAI' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance feature with AI',
    };
  }
}

/**
 * Generates AI context fields for a Screen node using OpenAI.
 * Returns component hierarchy, testing requirements, code references.
 */
export async function enhanceScreenWithAI(
  input: EnhanceScreenInput
): Promise<{ success: boolean; data?: EnhancedScreenAIContext; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to use AI enhancement.');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured.');
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildScreenEnhancementPrompt(input);

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a Next.js and React expert helping solo developers plan UI implementation. Generate component structures using Next.js 15 App Router, React Server Components, TypeScript, and Tailwind CSS. Provide specific file paths following Next.js conventions (/app routes, /components structure).',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3,
    });

    const outputText = response.choices[0]?.message?.content?.trim();
    if (!outputText) {
      throw new Error('AI enhancement failed to produce output.');
    }

    const parsed = parseScreenEnhancement(outputText);

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    logError(error, { action: 'enhanceScreenWithAI' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance screen with AI',
    };
  }
}

function buildFeatureEnhancementPrompt(input: EnhanceFeatureInput): string {
  return [
    '=== FEATURE TO ENHANCE ===',
    `Feature Name: ${input.featureName}`,
    input.summary ? `Summary: ${input.summary}` : null,
    input.problem ? `Problem: ${input.problem}` : null,
    input.userStory ? `User Story: ${input.userStory}` : null,
    input.acceptanceCriteria?.length
      ? `Acceptance Criteria:\n${input.acceptanceCriteria.map((c) => `  - ${c}`).join('\n')}`
      : null,
    input.technicalConstraints ? `Constraints: ${input.technicalConstraints}` : null,
    '',
    '=== GENERATE IMPLEMENTATION GUIDANCE ===',
    '',
    '=== TECH STACK CONTEXT ===',
    '- Framework: Next.js 15 with App Router (/app directory structure)',
    '- Database: Supabase (PostgreSQL with built-in Auth, Storage, Realtime)',
    '- Styling: Tailwind CSS',
    '- Language: TypeScript',
    '- Deployment: Vercel',
    '',
    'Based on this feature, generate Next.js + Supabase implementation guidance:',
    '',
    '1. AI CONTEXT (2-3 sentences):',
    '   - Next.js App Router patterns to use (Server Components, Server Actions, Route Handlers)',
    '   - Supabase integration approach (auth, database, storage)',
    '   - Key technical considerations and gotchas',
    '',
    '2. IMPLEMENTATION STEPS (5-8 steps):',
    '   - Use Next.js 15 conventions: /app/[feature]/page.tsx, /app/api/[feature]/route.ts',
    '   - Reference Supabase Client creation, RLS policies, and auth helpers',
    '   - Include specific file paths (e.g., "Create /app/api/auth/login/route.ts")',
    '   - Mention Server Actions where appropriate (e.g., "use server" directive)',
    '',
    '3. CODE REFERENCES (3-5 items):',
    '   - Supabase patterns: createClient(), auth.signUp(), from("table").select()',
    '   - Next.js patterns: Suspense boundaries, loading.tsx, error.tsx',
    '   - Relevant npm packages if needed',
    '',
    '4. TESTING REQUIREMENTS (2-3 sentences):',
    '   - What needs to be tested',
    '   - Edge cases to cover',
    '   - Integration vs unit tests',
    '',
    '5. RELATED FILES (3-6 file paths):',
    '   - Use Next.js App Router structure:',
    '     • Pages: /app/[feature]/page.tsx',
    '     • API Routes: /app/api/[feature]/route.ts',
    '     • Server Actions: /app/actions/[feature].ts',
    '     • Components: /components/[Feature]Component.tsx',
    '     • Utilities: /lib/[feature]/utils.ts',
    '',
    '6. TECHNICAL CONSTRAINTS (1-2 sentences):',
    '   - Supabase RLS (Row Level Security) policies for data protection',
    '   - Next.js caching strategies (revalidate, cache tags)',
    '   - Performance: Use Server Components by default, Client Components only when needed',
    '',
    'OUTPUT FORMAT (JSON):',
    '{',
    '  "aiContext": string,',
    '  "implementationSteps": string[],',
    '  "codeReferences": string[],',
    '  "testingRequirements": string,',
    '  "relatedFiles": string[],',
    '  "technicalConstraints": string',
    '}',
    '',
    'Return ONLY valid JSON, no markdown or explanatory text.',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildScreenEnhancementPrompt(input: EnhanceScreenInput): string {
  return [
    '=== SCREEN TO ENHANCE ===',
    `Screen Name: ${input.screenName}`,
    input.purpose ? `Purpose: ${input.purpose}` : null,
    input.keyElements?.length ? `Key Elements:\n${input.keyElements.map((e) => `  - ${e}`).join('\n')}` : null,
    input.userActions?.length ? `User Actions:\n${input.userActions.map((a) => `  - ${a}`).join('\n')}` : null,
    input.states?.length ? `States:\n${input.states.map((s) => `  - ${s}`).join('\n')}` : null,
    '',
    '=== GENERATE IMPLEMENTATION GUIDANCE ===',
    '',
    'Based on this screen, generate:',
    '',
    '1. AI CONTEXT (2-3 sentences):',
    '   - Component architecture recommendations',
    '   - State management approach',
    '   - Accessibility considerations',
    '',
    '2. COMPONENT HIERARCHY (5-8 components):',
    '   - React component tree structure',
    '   - Example: <LoginScreen> → <LoginForm> → <EmailInput>',
    '   - Include container vs presentational components',
    '',
    '3. CODE REFERENCES (3-5 items):',
    '   - Similar UI patterns in codebase',
    '   - Component library examples',
    '   - Relevant design system components',
    '',
    '4. TESTING REQUIREMENTS (2-3 sentences):',
    '   - User interaction tests needed',
    '   - Accessibility testing',
    '   - Visual regression testing',
    '',
    'OUTPUT FORMAT (JSON):',
    '{',
    '  "aiContext": string,',
    '  "componentHierarchy": string[],',
    '  "codeReferences": string[],',
    '  "testingRequirements": string',
    '}',
    '',
    'Return ONLY valid JSON, no markdown or explanatory text.',
  ]
    .filter(Boolean)
    .join('\n');
}

function parseFeatureEnhancement(outputText: string): EnhancedFeatureAIContext {
  const cleaned = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    aiContext: typeof parsed.aiContext === 'string' ? parsed.aiContext.slice(0, 500) : '',
    implementationSteps: Array.isArray(parsed.implementationSteps)
      ? parsed.implementationSteps.slice(0, 10).map((s: string) => s.slice(0, 200))
      : [],
    codeReferences: Array.isArray(parsed.codeReferences)
      ? parsed.codeReferences.slice(0, 8).map((r: string) => r.slice(0, 200))
      : [],
    testingRequirements: typeof parsed.testingRequirements === 'string' ? parsed.testingRequirements.slice(0, 400) : '',
    relatedFiles: Array.isArray(parsed.relatedFiles)
      ? parsed.relatedFiles.slice(0, 10).map((f: string) => f.slice(0, 150))
      : [],
    technicalConstraints: typeof parsed.technicalConstraints === 'string' ? parsed.technicalConstraints.slice(0, 400) : '',
  };
}

function parseScreenEnhancement(outputText: string): EnhancedScreenAIContext {
  const cleaned = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    aiContext: typeof parsed.aiContext === 'string' ? parsed.aiContext.slice(0, 500) : '',
    componentHierarchy: Array.isArray(parsed.componentHierarchy)
      ? parsed.componentHierarchy.slice(0, 10).map((c: string) => c.slice(0, 200))
      : [],
    codeReferences: Array.isArray(parsed.codeReferences)
      ? parsed.codeReferences.slice(0, 8).map((r: string) => r.slice(0, 200))
      : [],
    testingRequirements: typeof parsed.testingRequirements === 'string' ? parsed.testingRequirements.slice(0, 400) : '',
  };
}
