'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, RateLimitError, logError } from '@/lib/errors';
import type { FeatureNodeData, ScreenNodeData } from '@/types/nodes';

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
            'You are a technical architect helping developers plan feature implementation. Generate detailed, actionable implementation guidance.',
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
            'You are a frontend architect helping developers plan UI implementation. Generate detailed component structure and testing guidance.',
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
    'Based on this feature, generate:',
    '',
    '1. AI CONTEXT (2-3 sentences):',
    '   - What patterns/conventions to follow',
    '   - Key technical considerations',
    '   - Gotchas to avoid',
    '',
    '2. IMPLEMENTATION STEPS (5-8 steps):',
    '   - Specific, actionable steps in order',
    '   - Include file paths where relevant (e.g., "Create /api/auth/login route")',
    '   - Focus on "what to build" not "how to code"',
    '',
    '3. CODE REFERENCES (3-5 items):',
    '   - Similar features/patterns to reference',
    '   - Relevant file paths or modules',
    '   - Libraries or frameworks to use',
    '',
    '4. TESTING REQUIREMENTS (2-3 sentences):',
    '   - What needs to be tested',
    '   - Edge cases to cover',
    '   - Integration vs unit tests',
    '',
    '5. RELATED FILES (3-6 file paths):',
    '   - Files that will likely be created/modified',
    '   - Example: /api/users/route.ts, /components/UserForm.tsx',
    '',
    '6. TECHNICAL CONSTRAINTS (1-2 sentences):',
    '   - Performance considerations',
    '   - Security requirements',
    '   - Scalability concerns',
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
