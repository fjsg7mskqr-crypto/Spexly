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

type ParsedDetails = {
  sections: Record<string, string[]>;
  looseLines: string[];
};

function normalizeSectionKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseTaskDetails(details: string | null): ParsedDetails {
  const lines = (details ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: Record<string, string[]> = {};
  const looseLines: string[] = [];
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*]\s+/, '').trim();
    const headingMatch = line.match(/^([A-Za-z][A-Za-z0-9\s/_-]{1,40}):\s*(.*)$/);

    if (headingMatch) {
      currentKey = normalizeSectionKey(headingMatch[1]);
      if (!sections[currentKey]) sections[currentKey] = [];
      if (headingMatch[2]) sections[currentKey].push(headingMatch[2].trim());
      continue;
    }

    if (currentKey) {
      sections[currentKey].push(line);
    } else {
      looseLines.push(line);
    }
  }

  return { sections, looseLines };
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

function firstSectionValue(sections: Record<string, string[]>, keys: string[]): string {
  for (const key of keys) {
    const value = sections[key]?.find(Boolean);
    if (value) return value;
  }
  return '';
}

function sectionLines(sections: Record<string, string[]>, keys: string[]): string[] {
  for (const key of keys) {
    const values = sections[key]?.map((v) => v.trim()).filter(Boolean);
    if (values && values.length > 0) return values;
  }
  return [];
}

function toUpdateRecord<T extends Record<string, unknown>>(updates: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
}

function featureUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as FeatureNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const parsed = parseTaskDetails(task.details);
  const detailLines = parsed.looseLines.length > 0 ? parsed.looseLines : splitTaskDetails(task.details);
  const summary = firstSectionValue(parsed.sections, ['summary']);
  const problem = firstSectionValue(parsed.sections, ['problem', 'coreproblem']);
  const userStory = firstSectionValue(parsed.sections, ['userstory', 'story']);
  const risks = firstSectionValue(parsed.sections, ['risks', 'risk']);
  const metrics = firstSectionValue(parsed.sections, ['metrics', 'successmetrics']);
  const aiContext = firstSectionValue(parsed.sections, ['aicontext', 'context']);
  const testingRequirements = firstSectionValue(parsed.sections, ['testingrequirements', 'testing', 'tests']);
  const technicalConstraints = firstSectionValue(parsed.sections, ['technicalconstraints', 'constraints']);
  const acceptanceCriteria = sectionLines(parsed.sections, ['acceptancecriteria', 'criteria', 'acceptance']);
  const dependencies = sectionLines(parsed.sections, ['dependencies', 'dependson']);
  const implementationSteps = sectionLines(parsed.sections, ['implementationsteps', 'steps', 'plan']);
  const codeReferences = sectionLines(parsed.sections, ['codereferences', 'references', 'code']);
  const relatedFiles = sectionLines(parsed.sections, ['relatedfiles', 'files', 'filepaths']);

  const updates: Partial<FeatureNodeData> = {};
  if (!data.featureName?.trim()) updates.featureName = cleanTitle;
  if (!data.summary?.trim() && summary) updates.summary = summary;
  if (!data.problem?.trim() && problem) updates.problem = problem;
  if (!data.userStory?.trim() && userStory) updates.userStory = userStory;
  if (!data.risks?.trim() && risks) updates.risks = risks;
  if (!data.metrics?.trim() && metrics) updates.metrics = metrics;
  if (!data.aiContext?.trim() && aiContext) updates.aiContext = aiContext;
  if (!data.testingRequirements?.trim() && testingRequirements) updates.testingRequirements = testingRequirements;
  if (!data.technicalConstraints?.trim() && technicalConstraints) updates.technicalConstraints = technicalConstraints;

  const existingCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const mergedCriteria = uniqueStrings([...existingCriteria, ...acceptanceCriteria]);
  if (mergedCriteria.length !== existingCriteria.length) updates.acceptanceCriteria = mergedCriteria;

  const existingDependencies = Array.isArray(data.dependencies) ? data.dependencies : [];
  const mergedDependencies = uniqueStrings([...existingDependencies, ...dependencies]);
  if (mergedDependencies.length !== existingDependencies.length) updates.dependencies = mergedDependencies;

  const existingSteps = Array.isArray(data.implementationSteps) ? data.implementationSteps : [];
  const mergedSteps = uniqueStrings([...existingSteps, ...implementationSteps, ...detailLines]);
  if (mergedSteps.length !== existingSteps.length) {
    updates.implementationSteps = mergedSteps;
  }

  const existingCodeRefs = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const mergedCodeRefs = uniqueStrings([...existingCodeRefs, ...codeReferences]);
  if (mergedCodeRefs.length !== existingCodeRefs.length) updates.codeReferences = mergedCodeRefs;

  const existingRelatedFiles = Array.isArray(data.relatedFiles) ? data.relatedFiles : [];
  const mergedRelatedFiles = uniqueStrings([...existingRelatedFiles, ...relatedFiles]);
  if (mergedRelatedFiles.length !== existingRelatedFiles.length) updates.relatedFiles = mergedRelatedFiles;

  const taskNotes = [`Task: ${cleanTitle}`].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return toUpdateRecord(updates);
}

function screenUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as ScreenNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const parsed = parseTaskDetails(task.details);
  const purpose = firstSectionValue(parsed.sections, ['purpose', 'summary']);
  const navigation = firstSectionValue(parsed.sections, ['navigation']);
  const wireframeUrl = firstSectionValue(parsed.sections, ['wireframeurl']);
  const aiContext = firstSectionValue(parsed.sections, ['aicontext', 'context']);
  const testingRequirements = firstSectionValue(parsed.sections, ['testingrequirements', 'testing', 'tests']);
  const keyElements = sectionLines(parsed.sections, ['keyelements', 'elements']);
  const userActions = sectionLines(parsed.sections, ['useractions', 'actions']);
  const states = sectionLines(parsed.sections, ['states']);
  const dataSources = sectionLines(parsed.sections, ['datasources', 'sources']);
  const acceptanceCriteria = sectionLines(parsed.sections, ['acceptancecriteria', 'criteria', 'acceptance']);
  const componentHierarchy = sectionLines(parsed.sections, ['componenthierarchy', 'components']);
  const codeReferences = sectionLines(parsed.sections, ['codereferences', 'references', 'code']);

  const updates: Partial<ScreenNodeData> = {};
  if (!data.screenName?.trim()) updates.screenName = cleanTitle;
  if (!data.purpose?.trim() && purpose) updates.purpose = purpose;
  if (!data.navigation?.trim() && navigation) updates.navigation = navigation;
  if (!data.wireframeUrl?.trim() && wireframeUrl) updates.wireframeUrl = wireframeUrl;
  if (!data.aiContext?.trim() && aiContext) updates.aiContext = aiContext;
  if (!data.testingRequirements?.trim() && testingRequirements) updates.testingRequirements = testingRequirements;

  const existingKeyElements = Array.isArray(data.keyElements) ? data.keyElements : [];
  const mergedKeyElements = uniqueStrings([...existingKeyElements, ...keyElements]);
  if (mergedKeyElements.length !== existingKeyElements.length) updates.keyElements = mergedKeyElements;

  const existingActions = Array.isArray(data.userActions) ? data.userActions : [];
  const mergedActions = uniqueStrings([...existingActions, ...userActions]);
  if (mergedActions.length !== existingActions.length) updates.userActions = mergedActions;

  const existingStates = Array.isArray(data.states) ? data.states : [];
  const mergedStates = uniqueStrings([...existingStates, ...states]);
  if (mergedStates.length !== existingStates.length) updates.states = mergedStates;

  const existingSources = Array.isArray(data.dataSources) ? data.dataSources : [];
  const mergedSources = uniqueStrings([...existingSources, ...dataSources]);
  if (mergedSources.length !== existingSources.length) updates.dataSources = mergedSources;

  const existingCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const mergedCriteria = uniqueStrings([...existingCriteria, ...acceptanceCriteria]);
  if (mergedCriteria.length !== existingCriteria.length) updates.acceptanceCriteria = mergedCriteria;

  const existingHierarchy = Array.isArray(data.componentHierarchy) ? data.componentHierarchy : [];
  const mergedHierarchy = uniqueStrings([...existingHierarchy, ...componentHierarchy]);
  if (mergedHierarchy.length !== existingHierarchy.length) updates.componentHierarchy = mergedHierarchy;

  const existingCodeRefs = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const mergedCodeRefs = uniqueStrings([...existingCodeRefs, ...codeReferences]);
  if (mergedCodeRefs.length !== existingCodeRefs.length) updates.codeReferences = mergedCodeRefs;

  const taskNotes = [`Task: ${cleanTitle}`].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return toUpdateRecord(updates);
}

function techUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as TechStackNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const parsed = parseTaskDetails(task.details);
  const version = firstSectionValue(parsed.sections, ['version']);
  const rationale = firstSectionValue(parsed.sections, ['rationale']);
  const config = firstSectionValue(parsed.sections, ['configurationnotes', 'configuration']);
  const integrations = sectionLines(parsed.sections, ['integrationwith', 'integrations']);

  const updates: Partial<TechStackNodeData> = {};
  if (!data.toolName?.trim()) updates.toolName = cleanTitle;
  if (!data.version?.trim() && version) updates.version = version;
  if (!data.rationale?.trim() && rationale) updates.rationale = rationale;
  if (!data.configurationNotes?.trim() && config) updates.configurationNotes = config;

  const existingIntegrations = Array.isArray(data.integrationWith) ? data.integrationWith : [];
  const mergedIntegrations = uniqueStrings([...existingIntegrations, ...integrations]);
  if (mergedIntegrations.length !== existingIntegrations.length) updates.integrationWith = mergedIntegrations;

  const taskNotes = [`Task: ${cleanTitle}`].filter(Boolean).join('\n');
  const mergedNotes = appendNotes(data.notes, taskNotes);
  if (mergedNotes !== (data.notes || '')) {
    updates.notes = mergedNotes;
  }

  return toUpdateRecord(updates);
}

function ideaUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const data = node.data as IdeaNodeData;
  const cleanTitle = cleanTitlePrefix(task.title);
  const parsed = parseTaskDetails(task.details);
  const detailText = task.details?.trim() || cleanTitle;
  const appName = firstSectionValue(parsed.sections, ['appname']);
  const description = firstSectionValue(parsed.sections, ['description', 'summary']);
  const targetUser = firstSectionValue(parsed.sections, ['targetuser', 'audience']);
  const coreProblem = firstSectionValue(parsed.sections, ['coreproblem', 'problem']);
  const projectArchitecture = firstSectionValue(parsed.sections, ['projectarchitecture', 'architecture']);
  const corePatterns = sectionLines(parsed.sections, ['corepatterns', 'patterns']);
  const constraints = sectionLines(parsed.sections, ['constraints', 'technicalconstraints']);
  const tags = sectionLines(parsed.sections, ['tags']);

  const updates: Partial<IdeaNodeData> = {};
  if (!data.appName?.trim() && appName) updates.appName = appName;
  if (!data.description?.trim() && description) updates.description = description;
  if (!data.targetUser?.trim() && targetUser) updates.targetUser = targetUser;
  if (!data.coreProblem?.trim() && coreProblem) updates.coreProblem = coreProblem;
  if (!data.description?.trim() && description) updates.description = description;
  if (!data.coreProblem?.trim() && !coreProblem && !description && detailText) {
    updates.coreProblem = detailText;
  }
  if (data.coreProblem?.trim()) {
    const mergedDescription = appendNotes(data.description, `Task: ${cleanTitle}`);
    if (mergedDescription !== (data.description || '')) updates.description = mergedDescription;
  }
  if (!data.projectArchitecture?.trim() && projectArchitecture) updates.projectArchitecture = projectArchitecture;

  const existingPatterns = Array.isArray(data.corePatterns) ? data.corePatterns : [];
  const mergedPatterns = uniqueStrings([...existingPatterns, ...corePatterns]);
  if (mergedPatterns.length !== existingPatterns.length) updates.corePatterns = mergedPatterns;

  const existingConstraints = Array.isArray(data.constraints) ? data.constraints : [];
  const mergedConstraints = uniqueStrings([...existingConstraints, ...constraints]);
  if (mergedConstraints.length !== existingConstraints.length) updates.constraints = mergedConstraints;

  const existingTags = Array.isArray(data.tags) ? data.tags : [];
  const mergedTags = uniqueStrings([...existingTags, ...tags]);
  if (mergedTags.length !== existingTags.length) updates.tags = mergedTags;

  return toUpdateRecord(updates);
}

export function buildNodeAutofillUpdate(node: SpexlyNode, task: TaskLike): Record<string, unknown> {
  const updates =
    node.type === 'feature'
      ? featureUpdate(node, task)
      : node.type === 'screen'
        ? screenUpdate(node, task)
        : node.type === 'techStack'
          ? techUpdate(node, task)
          : node.type === 'idea'
            ? ideaUpdate(node, task)
            : {};

  // Hard safety: never create ad-hoc fields outside this node's current schema.
  const allowedFields = new Set(Object.keys(node.data as Record<string, unknown>));
  return Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.has(key))
  );

}
