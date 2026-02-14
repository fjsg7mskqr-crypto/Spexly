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
  summary: string;
  problem: string;
  userStory: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  risks: string;
  metrics: string;
  aiContext: string;
  implementationSteps: string[];
  codeReferences: string[];
  testingRequirements: string;
  relatedFiles: string[];
  technicalConstraints: string;
}

export interface EnhancedScreenAIContext {
  purpose: string;
  keyElements: string[];
  userActions: string[];
  states: string[];
  navigation: string;
  dataSources: string[];
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
    '=== GENERATE FEATURE DETAILS ===',
    '',
    '=== TECH STACK CONTEXT ===',
    '- Framework: Next.js 15 with App Router (/app directory structure)',
    '- Database: Supabase (PostgreSQL with built-in Auth, Storage, Realtime)',
    '- Styling: Tailwind CSS',
    '- Language: TypeScript',
    '- Deployment: Vercel',
    '',
    'Based on this feature, generate comprehensive details to fill in the feature card:',
    '',
    '1. SUMMARY (1-2 sentences): Concise description of what this feature does.',
    '',
    '2. PROBLEM (1-2 sentences): What user pain point or gap does this solve?',
    '',
    '3. USER STORY (1 sentence): "As a [user], I want [goal] so that [benefit]"',
    '',
    '4. ACCEPTANCE CRITERIA (3-5 items): Specific conditions that must be met.',
    '',
    '5. DEPENDENCIES (1-4 items): Other features, services, or systems this depends on.',
    '',
    '6. RISKS (1-2 sentences): Potential issues or unknowns.',
    '',
    '7. METRICS (1-2 sentences): How will success be measured?',
    '',
    '8. AI CONTEXT (2-3 sentences):',
    '   - Next.js App Router patterns to use (Server Components, Server Actions, Route Handlers)',
    '   - Supabase integration approach (auth, database, storage)',
    '   - Key technical considerations',
    '',
    '9. IMPLEMENTATION STEPS (5-8 steps):',
    '   - Use Next.js 15 conventions: /app/[feature]/page.tsx, /app/api/[feature]/route.ts',
    '   - Include specific file paths',
    '',
    '10. CODE REFERENCES (3-5 items): Relevant patterns, libraries, or existing code.',
    '',
    '11. TESTING REQUIREMENTS (2-3 sentences): What needs testing and edge cases.',
    '',
    '12. RELATED FILES (3-6 file paths): Next.js App Router file paths to create/modify.',
    '',
    '13. TECHNICAL CONSTRAINTS (1-2 sentences): Platform limitations, performance, RLS policies.',
    '',
    'OUTPUT FORMAT (JSON):',
    '{',
    '  "summary": string,',
    '  "problem": string,',
    '  "userStory": string,',
    '  "acceptanceCriteria": string[],',
    '  "dependencies": string[],',
    '  "risks": string,',
    '  "metrics": string,',
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
    '=== GENERATE SCREEN DETAILS ===',
    '',
    'Based on this screen, generate comprehensive details to fill in the screen card:',
    '',
    '1. PURPOSE (1-2 sentences): What is this screen for?',
    '',
    '2. KEY ELEMENTS (4-8 items): Major UI components on this screen.',
    '',
    '3. USER ACTIONS (3-6 items): What can users do on this screen?',
    '',
    '4. STATES (2-4 items): Different screen states (e.g., empty, loading, error, success).',
    '',
    '5. NAVIGATION (1-2 sentences): How users get to/from this screen.',
    '',
    '6. DATA SOURCES (2-4 items): APIs, stores, or data this screen needs.',
    '',
    '7. AI CONTEXT (2-3 sentences): Component architecture, state management, accessibility.',
    '',
    '8. COMPONENT HIERARCHY (5-8 components): React component tree structure.',
    '',
    '9. CODE REFERENCES (3-5 items): Relevant patterns, libraries, or existing components.',
    '',
    '10. TESTING REQUIREMENTS (2-3 sentences): User interaction and accessibility tests.',
    '',
    'OUTPUT FORMAT (JSON):',
    '{',
    '  "purpose": string,',
    '  "keyElements": string[],',
    '  "userActions": string[],',
    '  "states": string[],',
    '  "navigation": string,',
    '  "dataSources": string[],',
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
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 400) : '',
    problem: typeof parsed.problem === 'string' ? parsed.problem.slice(0, 400) : '',
    userStory: typeof parsed.userStory === 'string' ? parsed.userStory.slice(0, 400) : '',
    acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria)
      ? parsed.acceptanceCriteria.slice(0, 10).map((s: string) => s.slice(0, 200))
      : [],
    dependencies: Array.isArray(parsed.dependencies)
      ? parsed.dependencies.slice(0, 8).map((s: string) => s.slice(0, 200))
      : [],
    risks: typeof parsed.risks === 'string' ? parsed.risks.slice(0, 400) : '',
    metrics: typeof parsed.metrics === 'string' ? parsed.metrics.slice(0, 400) : '',
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
    purpose: typeof parsed.purpose === 'string' ? parsed.purpose.slice(0, 400) : '',
    keyElements: Array.isArray(parsed.keyElements)
      ? parsed.keyElements.slice(0, 10).map((s: string) => s.slice(0, 200))
      : [],
    userActions: Array.isArray(parsed.userActions)
      ? parsed.userActions.slice(0, 10).map((s: string) => s.slice(0, 200))
      : [],
    states: Array.isArray(parsed.states)
      ? parsed.states.slice(0, 8).map((s: string) => s.slice(0, 200))
      : [],
    navigation: typeof parsed.navigation === 'string' ? parsed.navigation.slice(0, 400) : '',
    dataSources: Array.isArray(parsed.dataSources)
      ? parsed.dataSources.slice(0, 8).map((s: string) => s.slice(0, 200))
      : [],
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
