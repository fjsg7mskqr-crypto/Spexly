import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';
import {
  truncate,
  getNodeDisplayName,
  getConnectedContext,
  getStringArray,
  getRelatedPromptNodes,
} from './exportContextUtils';

/**
 * Generates a .context/index.md file from the canvas nodes
 * This file provides persistent context for AI coding assistants
 */
export function generateContextFile(nodes: SpexlyNode[], edges: SpexlyEdge[] = []): string {
  const ideaNode = nodes.find((n) => n.type === 'idea');
  const featureNodes = nodes.filter((n) => n.type === 'feature');
  const screenNodes = nodes.filter((n) => n.type === 'screen');
  const techStackNodes = nodes.filter((n) => n.type === 'techStack');

  const sections: string[] = [];

  // Header
  sections.push('# Project Context');
  sections.push('');
  sections.push('> Generated from Spexly - AI Context Engineering Platform');
  sections.push('> This file provides persistent context for AI coding assistants');
  sections.push('');

  // Architecture Overview
  if (ideaNode?.type === 'idea') {
    const data = ideaNode.data;
    sections.push('## Architecture Overview');
    sections.push('');
    if (data.projectArchitecture) {
      sections.push(data.projectArchitecture);
      sections.push('');
    }
    if (data.description) {
      sections.push(`**Project Description:** ${data.description}`);
      sections.push('');
    }
    if (data.targetUser) {
      sections.push(`**Target User:** ${data.targetUser}`);
      sections.push('');
    }
    if (data.coreProblem) {
      sections.push(`**Core Problem:** ${data.coreProblem}`);
      sections.push('');
    }
  }

  // Core Patterns
  if (ideaNode?.type === 'idea' && ideaNode.data.corePatterns?.length > 0) {
    sections.push('## Key Architectural Patterns');
    sections.push('');
    ideaNode.data.corePatterns.forEach((pattern) => {
      sections.push(`- ${pattern}`);
    });
    sections.push('');
  }

  // Tech Stack
  if (techStackNodes.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');

    const categorized: Record<string, typeof techStackNodes> = {};
    techStackNodes.forEach((node) => {
      if (node.type === 'techStack') {
        const category = node.data.category;
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(node);
      }
    });

    Object.entries(categorized).forEach(([category, nodes]) => {
      sections.push(`### ${category}`);
      sections.push('');
      nodes.forEach((node) => {
        if (node.type === 'techStack') {
          const versionInfo = node.data.version ? ` (${node.data.version})` : '';
          sections.push(`- **${node.data.toolName}**${versionInfo}`);
          if (node.data.rationale) {
            sections.push(`  - Rationale: ${node.data.rationale}`);
          }
          if (node.data.configurationNotes) {
            sections.push(`  - Configuration: ${node.data.configurationNotes}`);
          }
        }
      });
      sections.push('');
    });
  }

  // Features
  if (featureNodes.length > 0) {
    sections.push('## Features');
    sections.push('');

    featureNodes.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`### ${data.featureName}`);
        sections.push('');

        if (data.userStory) {
          sections.push(`**User Story:** ${data.userStory}`);
          sections.push('');
        }

        if (data.acceptanceCriteria?.length > 0) {
          sections.push('**Acceptance Criteria:**');
          data.acceptanceCriteria.forEach((criterion) => {
            sections.push(`- ${criterion}`);
          });
          sections.push('');
        }

        if (data.implementationSteps?.length > 0) {
          sections.push('**Implementation Steps:**');
          data.implementationSteps.forEach((step, idx) => {
            sections.push(`${idx + 1}. ${step}`);
          });
          sections.push('');
        }

        if (data.aiContext) {
          sections.push(`**AI Context:** ${data.aiContext}`);
          sections.push('');
        }

        if (data.codeReferences?.length > 0) {
          sections.push('**Code References:**');
          data.codeReferences.forEach((ref) => {
            sections.push(`- ${ref}`);
          });
          sections.push('');
        }

        if (data.relatedFiles?.length > 0) {
          sections.push('**Related Files:**');
          data.relatedFiles.forEach((file) => {
            sections.push(`- \`${file}\``);
          });
          sections.push('');
        }

        if (data.testingRequirements) {
          sections.push(`**Testing:** ${data.testingRequirements}`);
          sections.push('');
        }

        if (data.dependencies?.length > 0) {
          sections.push('**Dependencies:**');
          data.dependencies.forEach((dep) => {
            sections.push(`- ${dep}`);
          });
          sections.push('');
        }

        sections.push('**Planning Metadata:**');
        sections.push(`- Priority: ${data.priority}`);
        sections.push(`- Status: ${data.status}`);
        sections.push(`- Effort: ${data.effort}`);
        if (typeof data.estimatedHours === 'number') {
          sections.push(`- Estimated Hours: ${data.estimatedHours}`);
        }
        if (data.tags?.length > 0) {
          sections.push(`- Tags: ${data.tags.join(', ')}`);
        }
        if (data.metrics) {
          sections.push(`- Metrics: ${data.metrics}`);
        }
        if (data.risks) {
          sections.push(`- Risks: ${data.risks}`);
        }
        if (data.notes) {
          sections.push(`- Notes: ${data.notes}`);
        }
        sections.push('');

        const connectedContext = getConnectedContext(node.id, nodes, edges);
        if (connectedContext.length > 0) {
          sections.push('**Connected Canvas Context:**');
          connectedContext.forEach(({ node: connectedNode, direction }) => {
            const directionLabel = direction === 'incoming' ? 'Incoming' : 'Outgoing';
            sections.push(`- [${directionLabel}] ${connectedNode.type}: ${getNodeDisplayName(connectedNode)}`);
          });
          sections.push('');
        }

        const relatedPrompts = getRelatedPromptNodes(node, nodes, edges);
        if (relatedPrompts.length > 0) {
          sections.push('**Prompt Learnings:**');
          relatedPrompts.forEach((promptNode, idx) => {
            if (promptNode.type !== 'prompt') return;
            sections.push(`- Prompt ${idx + 1} (${promptNode.data.targetTool})`);
            if (promptNode.data.resultNotes) {
              sections.push(`  - Result: ${truncate(promptNode.data.resultNotes, 240)}`);
            }
            if (promptNode.data.promptText) {
              sections.push(`  - Prompt: ${truncate(promptNode.data.promptText, 240)}`);
            }
            const breakdown = getStringArray(promptNode.data.breakdown);
            if (breakdown.length > 0) {
              sections.push(`  - Breakdown: ${breakdown.slice(0, 4).join(' | ')}`);
            }
            const refinements = getStringArray(promptNode.data.refinements);
            if (refinements.length > 0) {
              sections.push(`  - Refinements: ${refinements.slice(0, 3).join(' | ')}`);
            }
          });
          sections.push('');
        }

        sections.push('---');
        sections.push('');
      }
    });
  }

  // Screens
  if (screenNodes.length > 0) {
    sections.push('## Screens / UI Components');
    sections.push('');

    screenNodes.forEach((node) => {
      if (node.type === 'screen') {
        const data = node.data;
        sections.push(`### ${data.screenName}`);
        sections.push('');

        if (data.purpose) {
          sections.push(`**Purpose:** ${data.purpose}`);
          sections.push('');
        }

        if (data.componentHierarchy?.length > 0) {
          sections.push('**Component Hierarchy:**');
          data.componentHierarchy.forEach((component) => {
            sections.push(`- ${component}`);
          });
          sections.push('');
        }

        if (data.keyElements?.length > 0) {
          sections.push('**Key Elements:**');
          data.keyElements.forEach((element) => {
            sections.push(`- ${element}`);
          });
          sections.push('');
        }

        if (data.aiContext) {
          sections.push(`**AI Context:** ${data.aiContext}`);
          sections.push('');
        }

        if (data.codeReferences?.length > 0) {
          sections.push('**Code References:**');
          data.codeReferences.forEach((ref) => {
            sections.push(`- ${ref}`);
          });
          sections.push('');
        }

        sections.push('---');
        sections.push('');
      }
    });
  }

  // Constraints
  if (ideaNode?.type === 'idea' && ideaNode.data.constraints?.length > 0) {
    sections.push('## Technical Constraints');
    sections.push('');
    ideaNode.data.constraints.forEach((constraint) => {
      sections.push(`- ${constraint}`);
    });
    sections.push('');
  }

  // Collect all technical constraints from features
  const featureConstraints = featureNodes
    .filter((n) => n.type === 'feature' && n.data.technicalConstraints)
    .map((n) => (n.type === 'feature' ? n.data.technicalConstraints : ''))
    .filter(Boolean);

  if (featureConstraints.length > 0) {
    sections.push('## Feature-Specific Constraints');
    sections.push('');
    featureConstraints.forEach((constraint) => {
      sections.push(`- ${constraint}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}
