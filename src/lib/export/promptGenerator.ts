import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';
import {
  truncate,
  getNodeDisplayName,
  getConnectedContext,
  getStringArray,
  getRelatedPromptNodes,
} from './exportContextUtils';

/**
 * Generates an implementation prompt for a specific feature node
 * Optimized for Claude Code / Claude.ai
 */
export function generateFeaturePrompt(
  node: SpexlyNode,
  allNodes: SpexlyNode[],
  allEdges: SpexlyEdge[] = []
): string {
  if (node.type !== 'feature') {
    throw new Error('Node must be a feature node');
  }

  const data = node.data;
  const sections: string[] = [];

  // Header
  sections.push(`# Implementation Context: ${data.featureName}`);
  sections.push('');

  // Feature Overview
  sections.push('## Feature Overview');
  sections.push('');
  if (data.summary) {
    sections.push(data.summary);
    sections.push('');
  }
  if (data.problem) {
    sections.push(`**Problem:** ${data.problem}`);
    sections.push('');
  }

  // Feature Metadata
  sections.push('## Feature Metadata');
  sections.push('');
  sections.push(`- Priority: ${data.priority}`);
  sections.push(`- Status: ${data.status}`);
  sections.push(`- Effort: ${data.effort}`);
  if (typeof data.estimatedHours === 'number') {
    sections.push(`- Estimated Hours: ${data.estimatedHours}`);
  }
  if (data.tags?.length > 0) {
    sections.push(`- Tags: ${data.tags.join(', ')}`);
  }
  sections.push('');

  if (data.metrics) {
    sections.push('**Success Metrics:**');
    sections.push(data.metrics);
    sections.push('');
  }

  if (data.risks) {
    sections.push('**Risks / Unknowns:**');
    sections.push(data.risks);
    sections.push('');
  }

  if (data.notes) {
    sections.push('**Additional Notes:**');
    sections.push(data.notes);
    sections.push('');
  }

  // User Story
  if (data.userStory) {
    sections.push('## User Story');
    sections.push('');
    sections.push(data.userStory);
    sections.push('');
  }

  // Acceptance Criteria
  if (data.acceptanceCriteria?.length > 0) {
    sections.push('## Acceptance Criteria');
    sections.push('');
    data.acceptanceCriteria.forEach((criterion) => {
      sections.push(`- [ ] ${criterion}`);
    });
    sections.push('');
  }

  // Implementation Steps
  if (data.implementationSteps?.length > 0) {
    sections.push('## Implementation Steps');
    sections.push('');
    data.implementationSteps.forEach((step, idx) => {
      sections.push(`${idx + 1}. ${step}`);
    });
    sections.push('');
  }

  // AI Context
  if (data.aiContext) {
    sections.push('## Technical Context');
    sections.push('');
    sections.push(data.aiContext);
    sections.push('');
  }

  // Code References
  if (data.codeReferences?.length > 0) {
    sections.push('## Code References');
    sections.push('');
    sections.push('Existing patterns to follow:');
    sections.push('');
    data.codeReferences.forEach((ref) => {
      sections.push(`- ${ref}`);
    });
    sections.push('');
  }

  // Related Files
  if (data.relatedFiles?.length > 0) {
    sections.push('## Related Files');
    sections.push('');
    data.relatedFiles.forEach((file) => {
      sections.push(`- \`${file}\``);
    });
    sections.push('');
  }

  // Testing Requirements
  if (data.testingRequirements) {
    sections.push('## Testing Requirements');
    sections.push('');
    sections.push(data.testingRequirements);
    sections.push('');
  }

  // Dependencies
  if (data.dependencies?.length > 0) {
    sections.push('## Dependencies');
    sections.push('');
    sections.push('This feature depends on:');
    sections.push('');
    data.dependencies.forEach((dep) => {
      sections.push(`- ${dep}`);
    });
    sections.push('');
  }

  // Technical Constraints
  if (data.technicalConstraints) {
    sections.push('## Technical Constraints');
    sections.push('');
    sections.push(data.technicalConstraints);
    sections.push('');
  }

  // Graph Context
  const connectedContext = getConnectedContext(node.id, allNodes, allEdges);
  if (connectedContext.length > 0) {
    sections.push('## Connected Canvas Context');
    sections.push('');
    connectedContext.forEach(({ node: connectedNode, direction }) => {
      const directionLabel = direction === 'incoming' ? 'Incoming' : 'Outgoing';
      sections.push(`- [${directionLabel}] ${connectedNode.type}: ${getNodeDisplayName(connectedNode)}`);
    });
    sections.push('');
  }

  // Prompt Learnings
  const relatedPrompts = getRelatedPromptNodes(node, allNodes, allEdges);
  if (relatedPrompts.length > 0) {
    sections.push('## Prompt Learnings');
    sections.push('');
    relatedPrompts.forEach((promptNode, idx) => {
      if (promptNode.type !== 'prompt') return;
      sections.push(`### Prompt ${idx + 1} (${promptNode.data.targetTool})`);
      sections.push('');
      if (promptNode.data.promptText) {
        sections.push(`**Prompt:** ${truncate(promptNode.data.promptText, 350)}`);
        sections.push('');
      }
      if (promptNode.data.resultNotes) {
        sections.push(`**Result Notes:** ${truncate(promptNode.data.resultNotes, 350)}`);
        sections.push('');
      }
      const breakdown = getStringArray(promptNode.data.breakdown);
      if (breakdown.length > 0) {
        sections.push('**Task Breakdown:**');
        breakdown.slice(0, 8).forEach((item) => {
          sections.push(`- [ ] ${item}`);
        });
        sections.push('');
      }
      const refinements = getStringArray(promptNode.data.refinements);
      if (refinements.length > 0) {
        sections.push('**Refinements:**');
        refinements.slice(0, 6).forEach((item) => {
          sections.push(`- ${item}`);
        });
        sections.push('');
      }
      if (promptNode.data.actualOutput) {
        sections.push(`**Observed Output:** ${truncate(promptNode.data.actualOutput, 300)}`);
        sections.push('');
      }
      const contextUsed = getStringArray(promptNode.data.contextUsed);
      if (contextUsed.length > 0) {
        sections.push(`**Context Used:** ${contextUsed.join(', ')}`);
        sections.push('');
      }
    });
  }

  // Tech Stack Context (from techStack nodes)
  const techStackNodes = allNodes.filter((n) => n.type === 'techStack');
  if (techStackNodes.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');
    techStackNodes.forEach((node) => {
      if (node.type === 'techStack') {
        const versionInfo = node.data.version ? ` ${node.data.version}` : '';
        sections.push(`- ${node.data.toolName}${versionInfo}`);
      }
    });
    sections.push('');
  }

  // Footer
  sections.push('---');
  sections.push('');
  sections.push('Generated from Spexly - AI Context Engineering Platform');

  return sections.join('\n');
}

/**
 * Generates a Cursor Plan Mode compatible prompt
 */
export function generateCursorPlanPrompt(
  node: SpexlyNode,
  allNodes: SpexlyNode[],
  allEdges: SpexlyEdge[] = []
): string {
  if (node.type !== 'feature') {
    throw new Error('Node must be a feature node');
  }

  const data = node.data;
  const sections: string[] = [];
  const relatedNodeCount = allNodes.length;

  sections.push(`# Implementation Plan: ${data.featureName}`);
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  if (data.summary) {
    sections.push(data.summary);
    sections.push('');
  }

  if (relatedNodeCount > 0) {
    sections.push(`Project context: ${relatedNodeCount} node(s) in the current canvas.`);
    sections.push('');
  }

  sections.push('## Planning Metadata');
  sections.push('');
  sections.push(`- Priority: ${data.priority}`);
  sections.push(`- Status: ${data.status}`);
  sections.push(`- Effort: ${data.effort}`);
  if (typeof data.estimatedHours === 'number') {
    sections.push(`- Estimated Hours: ${data.estimatedHours}`);
  }
  if (data.tags?.length > 0) {
    sections.push(`- Tags: ${data.tags.join(', ')}`);
  }
  sections.push('');

  // File Structure
  if (data.relatedFiles?.length > 0 || data.codeReferences?.length > 0) {
    sections.push('## File Structure');
    sections.push('');
    const allFiles = [...(data.relatedFiles || []), ...(data.codeReferences || [])];
    const uniqueFiles = Array.from(new Set(allFiles));
    uniqueFiles.forEach((file) => {
      sections.push(`- ${file}`);
    });
    sections.push('');
  }

  // Implementation Steps as Checklist
  if (data.implementationSteps?.length > 0) {
    sections.push('## Implementation Checklist');
    sections.push('');
    data.implementationSteps.forEach((step) => {
      sections.push(`- [ ] ${step}`);
    });
    sections.push('');
  }

  // Dependencies
  if (data.dependencies?.length > 0) {
    sections.push('## Dependencies');
    sections.push('');
    data.dependencies.forEach((dep) => {
      sections.push(`- ${dep}`);
    });
    sections.push('');
  }

  if (data.risks || data.metrics || data.notes || data.technicalConstraints) {
    sections.push('## Risks, Metrics, and Constraints');
    sections.push('');
    if (data.risks) {
      sections.push(`- Risk: ${data.risks}`);
    }
    if (data.metrics) {
      sections.push(`- Success metric: ${data.metrics}`);
    }
    if (data.technicalConstraints) {
      sections.push(`- Constraint: ${data.technicalConstraints}`);
    }
    if (data.notes) {
      sections.push(`- Notes: ${data.notes}`);
    }
    sections.push('');
  }

  // Testing
  if (data.testingRequirements) {
    sections.push('## Testing Requirements');
    sections.push('');
    sections.push(data.testingRequirements);
    sections.push('');
  }

  // Context
  if (data.aiContext) {
    sections.push('## Technical Notes');
    sections.push('');
    sections.push(data.aiContext);
    sections.push('');
  }

  const connectedContext = getConnectedContext(node.id, allNodes, allEdges);
  if (connectedContext.length > 0) {
    sections.push('## Connected Canvas Context');
    sections.push('');
    connectedContext.forEach(({ node: connectedNode, direction }) => {
      sections.push(`- ${direction}: ${connectedNode.type} -> ${getNodeDisplayName(connectedNode)}`);
    });
    sections.push('');
  }

  const relatedPrompts = getRelatedPromptNodes(node, allNodes, allEdges);
  if (relatedPrompts.length > 0) {
    sections.push('## Prompt Learnings');
    sections.push('');
    relatedPrompts.forEach((promptNode) => {
      if (promptNode.type !== 'prompt') return;
      const learning =
        promptNode.data.resultNotes ||
        getStringArray(promptNode.data.refinements)[0] ||
        promptNode.data.promptText ||
        '';
      sections.push(`- ${promptNode.data.targetTool}: ${truncate(learning, 240)}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generates a full-project prompt for Bolt/Lovable style generators
 */
export function generateFullStackPrompt(nodes: SpexlyNode[]): string {
  const ideaNode = nodes.find((n) => n.type === 'idea');
  const featureNodes = nodes.filter((n) => n.type === 'feature');
  const screenNodes = nodes.filter((n) => n.type === 'screen');
  const techStackNodes = nodes.filter((n) => n.type === 'techStack');

  const sections: string[] = [];

  // Project Description
  if (ideaNode?.type === 'idea') {
    const data = ideaNode.data;
    sections.push(`Build a ${data.appName} that ${data.description}.`);
    sections.push('');
    if (data.targetUser) {
      sections.push(`**Target User:** ${data.targetUser}`);
      sections.push('');
    }
    if (data.coreProblem) {
      sections.push(`**Core Problem:** ${data.coreProblem}`);
      sections.push('');
    }
  }

  // Features
  if (featureNodes.length > 0) {
    sections.push('## Features');
    sections.push('');
    featureNodes.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`### ${data.featureName}`);
        if (data.userStory) {
          sections.push(data.userStory);
        }
        if (data.acceptanceCriteria?.length > 0) {
          sections.push('');
          data.acceptanceCriteria.forEach((criterion) => {
            sections.push(`- ${criterion}`);
          });
        }
        sections.push('');
      }
    });
  }

  // Screens
  if (screenNodes.length > 0) {
    sections.push('## Screens');
    sections.push('');
    screenNodes.forEach((node) => {
      if (node.type === 'screen') {
        const data = node.data;
        sections.push(`### ${data.screenName}`);
        if (data.purpose) {
          sections.push(data.purpose);
        }
        if (data.keyElements?.length > 0) {
          sections.push('');
          sections.push('Key elements:');
          data.keyElements.forEach((element) => {
            sections.push(`- ${element}`);
          });
        }
        sections.push('');
      }
    });
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
      sections.push(`**${category}:**`);
      nodes.forEach((node) => {
        if (node.type === 'techStack') {
          const versionInfo = node.data.version ? ` (${node.data.version})` : '';
          sections.push(`- ${node.data.toolName}${versionInfo}`);
        }
      });
      sections.push('');
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

  return sections.join('\n');
}
