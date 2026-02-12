'use client';

import { Sparkles } from 'lucide-react';
import type { FeatureNodeData, ScreenNodeData } from '@/types/nodes';

interface AIContextIndicatorProps {
  data: FeatureNodeData | ScreenNodeData;
}

/**
 * Calculates context completeness score (0-100%)
 * Checks for presence of AI context fields
 */
function calculateContextCompleteness(data: FeatureNodeData | ScreenNodeData): number {
  let totalFields = 0;
  let filledFields = 0;

  // Common fields
  totalFields += 3; // aiContext, testingRequirements, codeReferences
  if (data.aiContext && data.aiContext.trim()) filledFields++;
  if (data.testingRequirements && data.testingRequirements.trim()) filledFields++;
  if (data.codeReferences && data.codeReferences.length > 0) filledFields++;

  // Feature-specific fields
  if ('implementationSteps' in data && 'featureName' in data) {
    totalFields += 2; // implementationSteps, relatedFiles
    const featureData = data as FeatureNodeData;
    if (featureData.implementationSteps && featureData.implementationSteps.length > 0) filledFields++;
    if (featureData.relatedFiles && featureData.relatedFiles.length > 0) filledFields++;
  }

  // Screen-specific fields
  if ('componentHierarchy' in data && 'screenName' in data) {
    totalFields += 2; // componentHierarchy, acceptanceCriteria
    const screenData = data as ScreenNodeData;
    if (screenData.componentHierarchy && screenData.componentHierarchy.length > 0) filledFields++;
    if (screenData.acceptanceCriteria && screenData.acceptanceCriteria.length > 0) filledFields++;
  }

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Gets color classes based on completeness score
 */
function getColorClasses(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) {
    return {
      bg: 'bg-emerald-400/10',
      text: 'text-emerald-300',
      border: 'border-emerald-400/50',
    };
  } else if (score >= 50) {
    return {
      bg: 'bg-amber-400/10',
      text: 'text-amber-300',
      border: 'border-amber-400/50',
    };
  } else if (score > 0) {
    return {
      bg: 'bg-violet-400/10',
      text: 'text-violet-300',
      border: 'border-violet-400/50',
    };
  } else {
    return {
      bg: 'bg-slate-700/30',
      text: 'text-slate-400',
      border: 'border-slate-600/50',
    };
  }
}

/**
 * Shows AI context status and completeness percentage
 * Displayed in node header
 */
export function AIContextIndicator({ data }: AIContextIndicatorProps) {
  const score = calculateContextCompleteness(data);
  const colors = getColorClasses(score);

  if (score === 0) {
    return null; // Don't show indicator if no AI context is provided
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 ${colors.bg} ${colors.border}`}
      title={`AI Context Completeness: ${score}%`}
    >
      <Sparkles size={12} className={colors.text} />
      <span className={`text-xs font-medium ${colors.text}`}>{score}%</span>
    </div>
  );
}

/**
 * Detailed breakdown of what's missing for full AI context
 * Can be shown on hover or in expanded view
 */
export function ContextCompletenessDetails({ data }: AIContextIndicatorProps) {
  const featureData = 'featureName' in data ? (data as FeatureNodeData) : null;
  const screenData = 'screenName' in data ? (data as ScreenNodeData) : null;

  const checks = {
    aiContext: !!(data.aiContext && data.aiContext.trim()),
    testingRequirements: !!(data.testingRequirements && data.testingRequirements.trim()),
    codeReferences: !!(data.codeReferences && data.codeReferences.length > 0),
    implementationSteps: featureData && !!(featureData.implementationSteps && featureData.implementationSteps.length > 0),
    relatedFiles: featureData && !!(featureData.relatedFiles && featureData.relatedFiles.length > 0),
    componentHierarchy: screenData && !!(screenData.componentHierarchy && screenData.componentHierarchy.length > 0),
    acceptanceCriteria: screenData && !!(screenData.acceptanceCriteria && screenData.acceptanceCriteria.length > 0),
  };

  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium text-slate-300">AI Context Checklist:</div>
      <div className="space-y-0.5">
        <div className={checks.aiContext ? 'text-emerald-400' : 'text-slate-500'}>
          {checks.aiContext ? '✓' : '○'} AI Context
        </div>
        {'implementationSteps' in data && (
          <div className={checks.implementationSteps ? 'text-emerald-400' : 'text-slate-500'}>
            {checks.implementationSteps ? '✓' : '○'} Implementation Steps
          </div>
        )}
        <div className={checks.codeReferences ? 'text-emerald-400' : 'text-slate-500'}>
          {checks.codeReferences ? '✓' : '○'} Code References
        </div>
        <div className={checks.testingRequirements ? 'text-emerald-400' : 'text-slate-500'}>
          {checks.testingRequirements ? '✓' : '○'} Testing Requirements
        </div>
        {'relatedFiles' in data && (
          <div className={checks.relatedFiles ? 'text-emerald-400' : 'text-slate-500'}>
            {checks.relatedFiles ? '✓' : '○'} Related Files
          </div>
        )}
        {'componentHierarchy' in data && (
          <div className={checks.componentHierarchy ? 'text-emerald-400' : 'text-slate-500'}>
            {checks.componentHierarchy ? '✓' : '○'} Component Hierarchy
          </div>
        )}
        {'acceptanceCriteria' in data && (
          <div className={checks.acceptanceCriteria ? 'text-emerald-400' : 'text-slate-500'}>
            {checks.acceptanceCriteria ? '✓' : '○'} Acceptance Criteria
          </div>
        )}
      </div>
    </div>
  );
}
