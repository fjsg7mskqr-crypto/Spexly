import type {
  SpexlyNode,
  FeatureNodeData,
  ScreenNodeData,
  TechStackNodeData,
  IdeaNodeData,
} from '@/types/nodes';

interface TaskLike {
  title: string;
  details: string | null;
}

function cleanTitlePrefix(title: string): string {
  return title
    .replace(/^(feature|screen|tech stack|idea)\s*:\s*/i, '')
    .trim();
}

function splitTaskDetails(details: string | null): string[] {
  if (!details) return [];
  return details
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function appendNotes(existing: string | undefined, section: string): string {
  const trimmed = section.trim();
  if (!trimmed) return existing || '';
  if (!existing || !existing.trim()) return trimmed;
  if (existing.includes(trimmed)) return existing;
  return `${existing}\n\n${trimmed}`;
}

function featureUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as FeatureNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const detailLines = splitTaskDetails(task.details);

  const updates: Record<string, unknown> = {};
  if (!data.featureName?.trim()) updates.featureName = cleanTitle;
  if (!data.summary?.trim()) updates.summary = task.details?.trim() || cleanTitle;

  const existingSteps = Array.isArray(data.implementationSteps) ? data.implementationSteps : [];
  const mergedSteps = uniqueStrings([...existingSteps, ...detailLines]);
  if (mergedSteps.length !== existingSteps.length) {
    updates.implementationSteps = mergedSteps;
  }

  const taskNotes = [`Task: ${cleanTitle}`, task.details || ''].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return updates;
}

function screenUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as ScreenNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);

  const updates: Record<string, unknown> = {};
  if (!data.screenName?.trim()) updates.screenName = cleanTitle;
  if (!data.purpose?.trim() && task.details?.trim()) updates.purpose = task.details.trim();

  const taskNotes = [`Task: ${cleanTitle}`, task.details || ''].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return updates;
}

function techUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as TechStackNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);

  const updates: Record<string, unknown> = {};
  if (!data.toolName?.trim()) updates.toolName = cleanTitle;

  const taskNotes = [`Task: ${cleanTitle}`, task.details || ''].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return updates;
}

function ideaUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as IdeaNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const detailText = task.details?.trim() || cleanTitle;

  const updates: Record<string, unknown> = {};
  if (!data.coreProblem?.trim()) {
    updates.coreProblem = detailText;
  } else {
    const mergedDescription = appendNotes(data.description, `Task: ${cleanTitle}\n${detailText}`);
    if (mergedDescription !== (data.description || '')) {
      updates.description = mergedDescription;
    }
  }
  return updates;
}

export function buildNodeAutofillUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  if (node.type === 'feature') return featureUpdate(node, task);
  if (node.type === 'screen') return screenUpdate(node, task);
  if (node.type === 'techStack') return techUpdate(node, task);
  if (node.type === 'idea') return ideaUpdate(node, task);
  return {};
}
