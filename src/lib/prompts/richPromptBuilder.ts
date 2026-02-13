/**
 * Builds rich, context-aware prompts from one-liner text by aggregating
 * project context (idea, features, screens, tech stack).
 *
 * Uses the 5-component prompt structure:
 * Context → Specification → Requirements → Expected Output → Constraints
 */

import { rankFeatures, rankScreens } from './keywordMatcher';
import type {
  IdeaNodeData,
  FeatureNodeData,
  ScreenNodeData,
  TechStackNodeData,
} from '@/types/nodes';

/** Max features/screens to include per prompt to keep it focused */
const MAX_RELEVANT_FEATURES = 4;
const MAX_RELEVANT_SCREENS = 3;

interface RichPromptInput {
  promptText: string;
  idea: {
    appName: string;
    description: string;
    targetUser: string;
    coreProblem: string;
    constraints?: string[];
  };
  features: {
    featureName: string;
    summary: string;
    userStory?: string;
    acceptanceCriteria?: string[];
    implementationSteps?: string[];
    dependencies?: string[];
    technicalConstraints?: string;
  }[];
  screens: {
    screenName: string;
    purpose: string;
    keyElements?: string[];
    states?: string[];
  }[];
  techStack: {
    category: string;
    toolName: string;
    notes?: string;
  }[];
}

/**
 * Build a rich, multi-section prompt from a one-liner prompt text
 * and surrounding project context.
 */
export function buildRichPrompt(input: RichPromptInput): string {
  const { promptText, idea, features, screens, techStack } = input;
  const sections: string[] = [];

  // ── Header ──
  sections.push(`## Task: ${promptText}`);
  sections.push('');

  // ── 1. Project Context ──
  sections.push('### Project Context');
  if (idea.appName) {
    sections.push(`- **App:** ${idea.appName} — ${idea.description || 'No description'}`);
  }
  if (idea.targetUser) {
    sections.push(`- **Target User:** ${idea.targetUser}`);
  }
  if (idea.coreProblem) {
    sections.push(`- **Core Problem:** ${idea.coreProblem}`);
  }

  // Tech stack grouped by category
  if (techStack.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const tech of techStack) {
      const cat = tech.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      const entry = tech.notes ? `${tech.toolName} (${tech.notes})` : tech.toolName;
      grouped[cat].push(entry);
    }
    const stackLine = Object.entries(grouped)
      .map(([cat, tools]) => `${cat}: ${tools.join(', ')}`)
      .join(' | ');
    sections.push(`- **Tech Stack:** ${stackLine}`);
  }
  sections.push('');

  // ── 2. Relevant Features (Specification) ──
  const rankedFeatures = rankFeatures(promptText, features, 0.05);
  const topFeatures = rankedFeatures.slice(0, MAX_RELEVANT_FEATURES);

  if (topFeatures.length > 0) {
    sections.push('### Relevant Features');
    for (const { item } of topFeatures) {
      sections.push(`- **${item.featureName}**: ${item.summary || 'No summary'}`);

      if (item.userStory) {
        sections.push(`  - User Story: ${item.userStory}`);
      }
      if (item.acceptanceCriteria && item.acceptanceCriteria.length > 0) {
        sections.push(`  - Acceptance Criteria:`);
        for (const ac of item.acceptanceCriteria.slice(0, 5)) {
          sections.push(`    - ${ac}`);
        }
      }
      if (item.implementationSteps && item.implementationSteps.length > 0) {
        sections.push(`  - Implementation Steps:`);
        for (const step of item.implementationSteps.slice(0, 6)) {
          sections.push(`    - ${step}`);
        }
      }
    }
    sections.push('');
  }

  // ── 3. Relevant Screens ──
  const rankedScreens = rankScreens(promptText, screens, 0.05);
  const topScreens = rankedScreens.slice(0, MAX_RELEVANT_SCREENS);

  if (topScreens.length > 0) {
    sections.push('### Relevant Screens');
    for (const { item } of topScreens) {
      sections.push(`- **${item.screenName}**: ${item.purpose || 'No purpose defined'}`);

      if (item.keyElements && item.keyElements.length > 0) {
        sections.push(`  - Key Elements: ${item.keyElements.slice(0, 8).join(', ')}`);
      }
      if (item.states && item.states.length > 0) {
        sections.push(`  - States: ${item.states.join(', ')}`);
      }
    }
    sections.push('');
  }

  // ── 4. Requirements ──
  sections.push('### Requirements');
  sections.push('- Follow existing patterns and conventions in the codebase');
  sections.push('- Write TypeScript with proper types — no `any`');
  sections.push('- Include error handling for user-facing operations');

  // Gather technical constraints from related features
  const constraints: string[] = [];
  for (const { item } of topFeatures) {
    if (item.technicalConstraints) {
      constraints.push(item.technicalConstraints);
    }
  }
  if (idea.constraints && idea.constraints.length > 0) {
    for (const c of idea.constraints) {
      constraints.push(c);
    }
  }
  if (constraints.length > 0) {
    for (const c of constraints.slice(0, 4)) {
      sections.push(`- ${c}`);
    }
  }
  sections.push('');

  // ── 5. Expected Output ──
  sections.push('### Expected Output');
  sections.push('- Working implementation that satisfies the acceptance criteria above');
  sections.push('- All new code covered by tests for critical paths');
  sections.push('- No regressions to existing functionality');
  sections.push('');

  // ── 6. Constraints ──
  // Gather dependencies
  const deps: string[] = [];
  for (const { item } of topFeatures) {
    if (item.dependencies && item.dependencies.length > 0) {
      deps.push(...item.dependencies);
    }
  }
  if (deps.length > 0) {
    sections.push('### Dependencies');
    sections.push('These features/components must be in place first:');
    const uniqueDeps = [...new Set(deps)];
    for (const d of uniqueDeps.slice(0, 6)) {
      sections.push(`- ${d}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Convenience wrapper that accepts raw node data arrays
 * (as created by generateCanvas).
 */
export function buildRichPromptFromNodeData(
  promptText: string,
  ideaData: Partial<IdeaNodeData>,
  featureDataList: Partial<FeatureNodeData>[],
  screenDataList: Partial<ScreenNodeData>[],
  techStackDataList: Partial<TechStackNodeData>[],
): string {
  return buildRichPrompt({
    promptText,
    idea: {
      appName: ideaData.appName || '',
      description: ideaData.description || '',
      targetUser: ideaData.targetUser || '',
      coreProblem: ideaData.coreProblem || '',
      constraints: ideaData.constraints || [],
    },
    features: featureDataList.map((f) => ({
      featureName: f.featureName || '',
      summary: f.summary || '',
      userStory: f.userStory,
      acceptanceCriteria: f.acceptanceCriteria,
      implementationSteps: f.implementationSteps,
      dependencies: f.dependencies,
      technicalConstraints: f.technicalConstraints,
    })),
    screens: screenDataList.map((s) => ({
      screenName: s.screenName || '',
      purpose: s.purpose || '',
      keyElements: s.keyElements,
      states: s.states,
    })),
    techStack: techStackDataList.map((t) => ({
      category: t.category || 'Other',
      toolName: t.toolName || '',
      notes: t.notes,
    })),
  });
}
