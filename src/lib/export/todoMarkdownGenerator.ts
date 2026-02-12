import type { SpexlyNode } from '@/types/nodes';

/**
 * Generates a TODO.md file from canvas nodes
 * Organized by feature status for tracking implementation progress
 */
export function generateTodoMarkdown(nodes: SpexlyNode[]): string {
  const ideaNode = nodes.find((n) => n.type === 'idea');
  const featureNodes = nodes.filter((n) => n.type === 'feature');

  const sections: string[] = [];

  // Header
  const projectName = ideaNode?.type === 'idea' ? ideaNode.data.appName : 'Project';
  sections.push(`# ${projectName} TODO`);
  sections.push('');
  sections.push('> Generated from Spexly');
  sections.push('');

  if (ideaNode?.type === 'idea' && ideaNode.data.description) {
    sections.push(`**Project:** ${ideaNode.data.description}`);
    sections.push('');
  }

  // Group features by status
  const planned = featureNodes.filter((n) => n.type === 'feature' && n.data.status === 'Planned');
  const inProgress = featureNodes.filter((n) => n.type === 'feature' && n.data.status === 'In Progress');
  const built = featureNodes.filter((n) => n.type === 'feature' && n.data.status === 'Built');
  const blocked = featureNodes.filter((n) => n.type === 'feature' && n.data.status === 'Blocked');
  const broken = featureNodes.filter((n) => n.type === 'feature' && n.data.status === 'Broken');

  // Backlog
  if (planned.length > 0) {
    sections.push('## Backlog');
    sections.push('');
    planned.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`- [ ] **${data.featureName}** (${data.priority} Have · ${data.effort})`);
        if (data.summary) {
          sections.push(`  - ${data.summary}`);
        }
        if (data.aiContext) {
          sections.push(`  - Context: ${data.aiContext}`);
        }
        if (data.relatedFiles?.length > 0) {
          sections.push(`  - Files: ${data.relatedFiles.join(', ')}`);
        }
        if (data.dependencies?.length > 0) {
          sections.push(`  - Depends on: ${data.dependencies.join(', ')}`);
        }
        if (data.implementationSteps?.length > 0) {
          sections.push('  - Steps:');
          data.implementationSteps.forEach((step) => {
            sections.push(`    - [ ] ${step}`);
          });
        }
        sections.push('');
      }
    });
  }

  // In Progress
  if (inProgress.length > 0) {
    sections.push('## In Progress');
    sections.push('');
    inProgress.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`- [ ] **${data.featureName}** (${data.effort})`);
        if (data.summary) {
          sections.push(`  - ${data.summary}`);
        }
        if (data.implementationSteps?.length > 0) {
          sections.push('  - Steps:');
          data.implementationSteps.forEach((step) => {
            sections.push(`    - [ ] ${step}`);
          });
        }
        if (data.testingRequirements) {
          sections.push(`  - Testing: ${data.testingRequirements}`);
        }
        sections.push('');
      }
    });
  }

  // Blocked
  if (blocked.length > 0) {
    sections.push('## Blocked');
    sections.push('');
    blocked.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`- [ ] **${data.featureName}**`);
        if (data.dependencies?.length > 0) {
          sections.push(`  - Blocked by: ${data.dependencies.join(', ')}`);
        }
        if (data.risks) {
          sections.push(`  - Risk: ${data.risks}`);
        }
        sections.push('');
      }
    });
  }

  // Broken
  if (broken.length > 0) {
    sections.push('## Broken / Needs Fix');
    sections.push('');
    broken.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`- [ ] **${data.featureName}**`);
        if (data.risks) {
          sections.push(`  - Issue: ${data.risks}`);
        }
        sections.push('');
      }
    });
  }

  // Done
  if (built.length > 0) {
    sections.push('## Done');
    sections.push('');
    built.forEach((node) => {
      if (node.type === 'feature') {
        const data = node.data;
        sections.push(`- [x] **${data.featureName}**`);
        if (data.summary) {
          sections.push(`  - ${data.summary}`);
        }
        sections.push('');
      }
    });
  }

  // Footer with statistics
  sections.push('---');
  sections.push('');
  const totalFeatures = featureNodes.length;
  const completedFeatures = built.length;
  const progress = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;
  sections.push(`**Progress:** ${completedFeatures}/${totalFeatures} features (${progress}%)`);
  sections.push('');

  return sections.join('\n');
}

/**
 * Generates GitHub Issues JSON format from feature nodes
 */
export function generateGitHubIssues(nodes: SpexlyNode[]): Array<{
  title: string;
  body: string;
  labels: string[];
}> {
  const featureNodes = nodes.filter((n) => n.type === 'feature');

  return featureNodes.map((node) => {
    if (node.type !== 'feature') {
      return { title: '', body: '', labels: [] };
    }

    const data = node.data;
    const bodyParts: string[] = [];

    // User Story
    if (data.userStory) {
      bodyParts.push('## User Story');
      bodyParts.push('');
      bodyParts.push(data.userStory);
      bodyParts.push('');
    }

    // Problem
    if (data.problem) {
      bodyParts.push('## Problem');
      bodyParts.push('');
      bodyParts.push(data.problem);
      bodyParts.push('');
    }

    // Acceptance Criteria
    if (data.acceptanceCriteria?.length > 0) {
      bodyParts.push('## Acceptance Criteria');
      bodyParts.push('');
      data.acceptanceCriteria.forEach((criterion) => {
        bodyParts.push(`- [ ] ${criterion}`);
      });
      bodyParts.push('');
    }

    // Implementation Steps
    if (data.implementationSteps?.length > 0) {
      bodyParts.push('## Implementation Steps');
      bodyParts.push('');
      data.implementationSteps.forEach((step, idx) => {
        bodyParts.push(`${idx + 1}. ${step}`);
      });
      bodyParts.push('');
    }

    // Technical Context
    if (data.aiContext) {
      bodyParts.push('## Technical Context');
      bodyParts.push('');
      bodyParts.push(data.aiContext);
      bodyParts.push('');
    }

    // Code References
    if (data.codeReferences?.length > 0) {
      bodyParts.push('## Code References');
      bodyParts.push('');
      data.codeReferences.forEach((ref) => {
        bodyParts.push(`- ${ref}`);
      });
      bodyParts.push('');
    }

    // Testing
    if (data.testingRequirements) {
      bodyParts.push('## Testing Requirements');
      bodyParts.push('');
      bodyParts.push(data.testingRequirements);
      bodyParts.push('');
    }

    // Dependencies
    if (data.dependencies?.length > 0) {
      bodyParts.push('## Dependencies');
      bodyParts.push('');
      data.dependencies.forEach((dep) => {
        bodyParts.push(`- ${dep}`);
      });
      bodyParts.push('');
    }

    // Labels based on priority and effort
    const labels: string[] = [];
    if (data.priority === 'Must') labels.push('priority: high');
    else if (data.priority === 'Should') labels.push('priority: medium');
    else labels.push('priority: low');

    if (data.effort === 'XS' || data.effort === 'S') labels.push('effort: small');
    else if (data.effort === 'M') labels.push('effort: medium');
    else labels.push('effort: large');

    if (data.status === 'Blocked') labels.push('blocked');

    return {
      title: data.featureName,
      body: bodyParts.join('\n'),
      labels,
    };
  });
}
