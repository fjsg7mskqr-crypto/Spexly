import type { GenerateCanvasInput, GenerateCanvasOutput } from '@/lib/generateCanvas';
import { generateCanvas } from '@/lib/generateCanvas';
import type {
  SpexlyNode,
  SpexlyEdge,
  TechCategory,
  TargetTool,
  NoteNodeData,
  IdeaNodeData,
} from '@/types/nodes';

export interface DocumentImportOutput {
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

interface ParsedDocument {
  appName: string;
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string[];
  screens: string[];
  techStack: { category: TechCategory; toolName: string; notes?: string }[];
  prompts: { text: string; targetTool?: TargetTool }[];
  notes: string[];
  tool: TargetTool;
  sourceExcerpt: string;
}

const SECTION_ALIASES: Record<string, keyof ParsedDocument> = {
  idea: 'description',
  summary: 'description',
  description: 'description',
  overview: 'description',
  'target user': 'targetUser',
  audience: 'targetUser',
  user: 'targetUser',
  problem: 'coreProblem',
  pain: 'coreProblem',
  features: 'features',
  functionality: 'features',
  screens: 'screens',
  pages: 'screens',
  ui: 'screens',
  'tech stack': 'techStack',
  stack: 'techStack',
  tech: 'techStack',
  prompts: 'prompts',
  notes: 'notes',
};

const TOOL_NAMES: TargetTool[] = ['Claude', 'Bolt', 'Cursor', 'Lovable', 'Replit', 'Other'];

function detectTool(text: string): TargetTool {
  const lowered = text.toLowerCase();
  for (const tool of TOOL_NAMES) {
    if (tool === 'Other') continue;
    if (lowered.includes(tool.toLowerCase())) return tool;
  }
  return 'Claude';
}

function normalizeHeading(text: string): string {
  return text.replace(/[#*`_]/g, '').trim().toLowerCase();
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const match = line.match(/^([A-Za-z][A-Za-z\s]+):\s*(.+)$/);
  if (!match) return null;
  return { key: match[1].trim().toLowerCase(), value: match[2].trim() };
}

function parseTechStackItem(raw: string) {
  const match = raw.match(/^(frontend|backend|database|auth|hosting|other)\s*[:\-]\s*(.+)$/i);
  if (match) {
    const category = match[1].trim();
    const toolName = match[2].trim();
    return {
      category: (category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()) as TechCategory,
      toolName,
    };
  }
  return { category: 'Other' as TechCategory, toolName: raw.trim() };
}

function extractBullet(line: string): string | null {
  const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
  if (bulletMatch) return bulletMatch[1].trim();
  const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
  if (numberedMatch) return numberedMatch[1].trim();
  return null;
}

function finalizeParsed(parsed: ParsedDocument) {
  if (!parsed.description && parsed.notes.length > 0) {
    parsed.description = parsed.notes[0];
  }
}

export function parseDocumentToCanvas(text: string): DocumentImportOutput {
  const trimmed = text.trim();
  if (!trimmed) {
    return { nodes: [], edges: [] };
  }

  const parsed: ParsedDocument = {
    appName: '',
    description: '',
    targetUser: '',
    coreProblem: '',
    features: [],
    screens: [],
    techStack: [],
    prompts: [],
    notes: [],
    tool: detectTool(trimmed),
    sourceExcerpt: trimmed.slice(0, 2000),
  };

  let currentSection: keyof ParsedDocument | null = null;
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const rawLine of lines) {
    const keyValue = parseKeyValue(rawLine);
    if (keyValue) {
      const key = keyValue.key;
      const value = keyValue.value;
      if (key.includes('app') || key.includes('project') || key.includes('name')) {
        parsed.appName = value;
        continue;
      }
      if (key.includes('target') || key.includes('audience') || key.includes('user')) {
        parsed.targetUser = value;
        continue;
      }
      if (key.includes('problem') || key.includes('pain')) {
        parsed.coreProblem = value;
        continue;
      }
      if (key.includes('description') || key.includes('summary') || key.includes('overview')) {
        parsed.description = value;
        continue;
      }
    }

    const headingMatch = rawLine.match(/^#{1,6}\s+(.+)$/) || rawLine.match(/^([A-Za-z][A-Za-z\s]+):$/);
    if (headingMatch) {
      const heading = normalizeHeading(headingMatch[1]);
      const matchedKey = Object.keys(SECTION_ALIASES).find((alias) => heading.includes(alias));
      currentSection = matchedKey ? SECTION_ALIASES[matchedKey] : null;
      continue;
    }

    const bullet = extractBullet(rawLine);
    if (bullet) {
      if (currentSection === 'features') {
        parsed.features.push(bullet);
      } else if (currentSection === 'screens') {
        parsed.screens.push(bullet);
      } else if (currentSection === 'techStack') {
        parsed.techStack.push(parseTechStackItem(bullet));
      } else if (currentSection === 'prompts') {
        parsed.prompts.push({ text: bullet, targetTool: parsed.tool });
      } else if (currentSection === 'notes') {
        parsed.notes.push(bullet);
      } else {
        parsed.notes.push(bullet);
      }
      continue;
    }

    if (currentSection === 'description') {
      parsed.description = parsed.description ? `${parsed.description} ${rawLine}` : rawLine;
      continue;
    }

    if (currentSection === 'targetUser') {
      parsed.targetUser = parsed.targetUser ? `${parsed.targetUser} ${rawLine}` : rawLine;
      continue;
    }

    if (currentSection === 'coreProblem') {
      parsed.coreProblem = parsed.coreProblem ? `${parsed.coreProblem} ${rawLine}` : rawLine;
      continue;
    }

    parsed.notes.push(rawLine);
  }

  finalizeParsed(parsed);

  const input: GenerateCanvasInput = {
    description: parsed.description,
    targetUser: parsed.targetUser,
    coreProblem: parsed.coreProblem,
    features: parsed.features,
    screens: parsed.screens,
    tool: parsed.tool,
    techStack: parsed.techStack,
    prompts: parsed.prompts,
  };

  const canvas: GenerateCanvasOutput = generateCanvas(input);
  const ts = Date.now();

  const nodes = canvas.nodes.map((node) => {
    if (node.type === 'idea') {
      return {
        ...node,
        data: {
          ...(node.data as IdeaNodeData),
          appName: parsed.appName || (node.data as IdeaNodeData).appName,
          description: parsed.description || (node.data as IdeaNodeData).description,
          targetUser: parsed.targetUser || (node.data as IdeaNodeData).targetUser,
          coreProblem: parsed.coreProblem || (node.data as IdeaNodeData).coreProblem,
        } as IdeaNodeData,
      };
    }
    return node;
  });

  if (parsed.sourceExcerpt) {
    const ideaNode = nodes.find((node) => node.type === 'idea');
    const noteNode: SpexlyNode = {
      id: `note-import-${ts}`,
      type: 'note',
      position: {
        x: (ideaNode?.position.x ?? 0) - 320,
        y: (ideaNode?.position.y ?? 0) + 180,
      },
      data: {
        title: 'Imported Document',
        body: parsed.sourceExcerpt,
        colorTag: 'Slate',
        expanded: true,
        completed: false,
      } as NoteNodeData,
    };
    nodes.push(noteNode);

    if (ideaNode) {
      canvas.edges.push({
        id: `e-${noteNode.id}-${ideaNode.id}`,
        source: noteNode.id,
        target: ideaNode.id,
      });
    }
  }

  return { nodes, edges: canvas.edges };
}
