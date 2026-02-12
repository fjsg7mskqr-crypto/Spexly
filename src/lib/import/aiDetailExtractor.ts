import OpenAI from 'openai';
import type { FeaturePriority, FeatureStatus, FeatureEffort } from '@/types/nodes';

export interface DetailedFeature {
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
}

export interface DetailedScreen {
  screenName: string;
  purpose: string;
  keyElements: string[];
  userActions: string[];
  states: string[];
  navigation: string;
  dataSources: string[];
  wireframeUrl: string;
  notes: string;
}

const FEATURE_PRIORITIES = new Set<FeaturePriority>(['Must', 'Should', 'Nice']);
const FEATURE_STATUSES = new Set<FeatureStatus>(['Planned', 'In Progress', 'Built', 'Broken', 'Blocked']);
const FEATURE_EFFORTS = new Set<FeatureEffort>(['XS', 'S', 'M', 'L', 'XL']);

function sanitizePriority(value: unknown): FeaturePriority {
  return FEATURE_PRIORITIES.has(value as FeaturePriority) ? (value as FeaturePriority) : 'Must';
}

function sanitizeStatus(value: unknown): FeatureStatus {
  return FEATURE_STATUSES.has(value as FeatureStatus) ? (value as FeatureStatus) : 'Planned';
}

function sanitizeEffort(value: unknown): FeatureEffort {
  return FEATURE_EFFORTS.has(value as FeatureEffort) ? (value as FeatureEffort) : 'M';
}

function clampText(value: string, maxLength: number = 400): string {
  return value.trim().slice(0, maxLength);
}

function clampList(values: string[], max: number, maxItemLength: number = 200): string[] {
  return values
    .filter(Boolean)
    .map((v) => clampText(v, maxItemLength))
    .slice(0, max);
}

function safeParseJson(payload: string): Record<string, unknown> {
  const cleaned = payload
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

function buildExtractionPrompt(
  features: string[],
  screens: string[],
  prdText: string
): string {
  // Truncate PRD if too long (leave room for prompt + response)
  const maxPrdLength = 12000;
  const truncatedPrd = prdText.length > maxPrdLength
    ? prdText.slice(0, maxPrdLength) + '\n\n[... document truncated for length ...]'
    : prdText;

  return [
    'You are a product specification expert. Extract detailed structured data from a PRD.',
    '',
    'PRD DOCUMENT:',
    '---',
    truncatedPrd,
    '---',
    '',
    features.length > 0 ? `FEATURES TO DETAIL: ${features.join(', ')}` : null,
    screens.length > 0 ? `SCREENS TO DETAIL: ${screens.join(', ')}` : null,
    '',
    '=== EXTRACTION REQUIREMENTS ===',
    '',
    'For each FEATURE, extract from the PRD:',
    '• summary: 1-2 sentence overview of what the feature does',
    '• problem: What user pain point does this solve?',
    '• userStory: "As a [persona], I want [action] so that [benefit]"',
    '• acceptanceCriteria: 3-5 specific, testable criteria from PRD (or infer reasonable ones)',
    '• priority: Must/Should/Nice based on PRD emphasis (default: Must)',
    '• status: Always "Planned" for new imports',
    '• effort: XS(<1d), S(1-3d), M(3-7d), L(1-2w), XL(2+w) - estimate based on complexity',
    '• dependencies: List OTHER features that must be built first (use feature names)',
    '• risks: 1-2 technical/UX risks + mitigation (infer if not stated)',
    '• metrics: 2-4 measurable KPIs to track success',
    '• notes: Any additional context from PRD',
    '',
    'For each SCREEN, extract from the PRD:',
    '• purpose: Why this screen exists (user goal)',
    '• keyElements: 6-10 specific UI components (button names, input fields, not generic "form")',
    '• userActions: 5-8 actions users can take (verbs: click, enter, select, upload)',
    '• states: 4-6 UI states (always: loading, error, success, empty + infer others)',
    '• navigation: Where user goes from this screen',
    '• dataSources: API endpoints or data stores (infer from context)',
    '• wireframeUrl: Leave empty unless PRD includes a link',
    '• notes: Implementation hints from PRD',
    '',
    'CRITICAL: If a field is not explicitly in the PRD, INFER reasonable values from context.',
    'CRITICAL: Return ONLY valid JSON, no markdown or explanatory text.',
    '',
    'OUTPUT JSON SCHEMA:',
    '{',
    '  "features": [{',
    '    "featureName": string,',
    '    "summary": string,',
    '    "problem": string,',
    '    "userStory": string,',
    '    "acceptanceCriteria": string[],',
    '    "priority": "Must|Should|Nice",',
    '    "status": "Planned",',
    '    "effort": "XS|S|M|L|XL",',
    '    "dependencies": string[],',
    '    "risks": string,',
    '    "metrics": string,',
    '    "notes": string',
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
    '    "notes": string',
    '  }]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Extracts detailed structured fields for features and screens from PRD text.
 * Uses AI to populate acceptanceCriteria, risks, metrics, keyElements, states, etc.
 *
 * @param features - List of feature names to extract details for
 * @param screens - List of screen names to extract details for
 * @param prdText - Full PRD document text for context
 * @param apiKey - OpenAI API key
 * @param model - OpenAI model to use (default: gpt-4.1-mini)
 * @returns Fully populated DetailedFeature and DetailedScreen arrays
 */
export async function extractDetailedFields(
  features: string[],
  screens: string[],
  prdText: string,
  apiKey: string,
  model: string = 'gpt-4.1-mini',
  maxFieldLength: number = 400
): Promise<{
  features: DetailedFeature[];
  screens: DetailedScreen[];
}> {
  // If no features or screens to detail, return empty
  if (features.length === 0 && screens.length === 0) {
    return { features: [], screens: [] };
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildExtractionPrompt(features, screens, prdText);

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 4500,
    temperature: 0.2,
  });

  const outputText = response.choices[0]?.message?.content?.trim();
  if (!outputText) {
    throw new Error('AI extraction failed to produce output');
  }

  const parsed = safeParseJson(outputText);

  // Parse features
  const detailedFeatures: DetailedFeature[] = Array.isArray(parsed.features)
    ? (parsed.features as Record<string, unknown>[])
        .map((item) => ({
          featureName: typeof item.featureName === 'string' ? clampText(item.featureName, maxFieldLength) : '',
          summary: typeof item.summary === 'string' ? clampText(item.summary, maxFieldLength) : '',
          problem: typeof item.problem === 'string' ? clampText(item.problem, maxFieldLength) : '',
          userStory: typeof item.userStory === 'string' ? clampText(item.userStory, maxFieldLength) : '',
          acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
            ? clampList(item.acceptanceCriteria as string[], 8)
            : [],
          priority: sanitizePriority(item.priority),
          status: sanitizeStatus(item.status),
          effort: sanitizeEffort(item.effort),
          dependencies: Array.isArray(item.dependencies)
            ? clampList(item.dependencies as string[], 8)
            : [],
          risks: typeof item.risks === 'string' ? clampText(item.risks, maxFieldLength) : '',
          metrics: typeof item.metrics === 'string' ? clampText(item.metrics, maxFieldLength) : '',
          notes: typeof item.notes === 'string' ? clampText(item.notes, maxFieldLength) : '',
        }))
        .filter((f) => f.featureName.length > 0)
    : [];

  // Parse screens
  const detailedScreens: DetailedScreen[] = Array.isArray(parsed.screens)
    ? (parsed.screens as Record<string, unknown>[])
        .map((item) => ({
          screenName: typeof item.screenName === 'string' ? clampText(item.screenName, maxFieldLength) : '',
          purpose: typeof item.purpose === 'string' ? clampText(item.purpose, maxFieldLength) : '',
          keyElements: Array.isArray(item.keyElements)
            ? clampList(item.keyElements as string[], 12)
            : [],
          userActions: Array.isArray(item.userActions)
            ? clampList(item.userActions as string[], 10)
            : [],
          states: Array.isArray(item.states) ? clampList(item.states as string[], 8) : [],
          navigation: typeof item.navigation === 'string' ? clampText(item.navigation, maxFieldLength) : '',
          dataSources: Array.isArray(item.dataSources)
            ? clampList(item.dataSources as string[], 8)
            : [],
          wireframeUrl: typeof item.wireframeUrl === 'string' ? clampText(item.wireframeUrl, maxFieldLength) : '',
          notes: typeof item.notes === 'string' ? clampText(item.notes, maxFieldLength) : '',
        }))
        .filter((s) => s.screenName.length > 0)
    : [];

  return {
    features: detailedFeatures,
    screens: detailedScreens,
  };
}
