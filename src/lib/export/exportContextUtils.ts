import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

export function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function getNodeDisplayName(node: SpexlyNode): string {
  switch (node.type) {
    case 'idea':
      return node.data.appName || 'Idea';
    case 'feature':
      return node.data.featureName || 'Feature';
    case 'screen':
      return node.data.screenName || 'Screen';
    case 'techStack':
      return node.data.toolName || 'Tech Stack';
    case 'prompt':
      return `${node.data.targetTool || 'AI'} Prompt`;
    case 'note':
      return node.data.title || 'Note';
    default:
      return 'Node';
  }
}

export function getConnectedContext(
  featureId: string,
  allNodes: SpexlyNode[],
  allEdges: SpexlyEdge[]
): Array<{ node: SpexlyNode; direction: 'incoming' | 'outgoing' }> {
  const nodeById = new Map(allNodes.map((n) => [n.id, n]));
  const connections: Array<{ node: SpexlyNode; direction: 'incoming' | 'outgoing' }> = [];
  const seen = new Set<string>();

  allEdges.forEach((edge) => {
    if (edge.source !== featureId && edge.target !== featureId) return;
    const connectedId = edge.source === featureId ? edge.target : edge.source;
    const connectedNode = nodeById.get(connectedId);
    if (!connectedNode || seen.has(connectedNode.id)) return;

    seen.add(connectedNode.id);
    connections.push({
      node: connectedNode,
      direction: edge.source === featureId ? 'outgoing' : 'incoming',
    });
  });

  return connections;
}

export function getRelatedPromptNodes(
  featureNode: SpexlyNode,
  allNodes: SpexlyNode[],
  allEdges: SpexlyEdge[]
): SpexlyNode[] {
  if (featureNode.type !== 'feature') return [];

  const promptNodes = allNodes.filter((n) => n.type === 'prompt');
  if (promptNodes.length === 0) return [];

  const connectedContext = getConnectedContext(featureNode.id, allNodes, allEdges);
  const contextNodeIds = new Set([featureNode.id, ...connectedContext.map((c) => c.node.id)]);
  const featureNameLower = (featureNode.data.featureName || '').toLowerCase().trim();

  const relatedPromptIds = new Set<string>();

  allEdges.forEach((edge) => {
    const sourceIsPrompt = promptNodes.some((n) => n.id === edge.source);
    const targetIsPrompt = promptNodes.some((n) => n.id === edge.target);
    if (!sourceIsPrompt && !targetIsPrompt) return;

    const promptId = sourceIsPrompt ? edge.source : edge.target;
    const otherId = sourceIsPrompt ? edge.target : edge.source;
    if (contextNodeIds.has(otherId)) {
      relatedPromptIds.add(promptId);
    }
  });

  if (featureNameLower.length > 0) {
    promptNodes.forEach((prompt) => {
      if (prompt.type !== 'prompt') return;
      const contextUsed = getStringArray(prompt.data.contextUsed).join(' ').toLowerCase();
      const promptText = (prompt.data.promptText || '').toLowerCase();
      const resultNotes = (prompt.data.resultNotes || '').toLowerCase();
      if (
        promptText.includes(featureNameLower) ||
        resultNotes.includes(featureNameLower) ||
        contextUsed.includes(featureNameLower)
      ) {
        relatedPromptIds.add(prompt.id);
      }
    });
  }

  return promptNodes.filter((node) => relatedPromptIds.has(node.id));
}
