/**
 * Conversation Parser
 *
 * Parses Claude Code JSONL transcripts and plain-text AI conversations
 * into structured markdown that the import pipeline can process.
 *
 * Supported formats:
 * - Claude Code JSONL transcripts (~/.claude/projects/.../session.jsonl)
 * - Plain text copy-paste from terminal (Human: / Assistant: blocks)
 * - Generic conversation text
 */

// ── Types ──────────────────────────────────────────────────

export type ConversationSource = 'claude-code' | 'codex' | 'generic';

export interface ParsedMessage {
  role: 'human' | 'assistant';
  text: string;
  timestamp?: string;
}

export interface ConversationParseResult {
  source: ConversationSource;
  messages: ParsedMessage[];
  sessionId?: string;
  projectDir?: string;
  gitBranch?: string;
  /** Markdown string ready for the import pipeline */
  markdown: string;
}

// ── JSONL types (subset of Claude Code transcript format) ──

interface JsonlMessage {
  role: 'user' | 'assistant';
  content: string | JsonlContentBlock[];
}

interface JsonlContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: unknown;
}

interface JsonlEntry {
  type: string;
  subtype?: string;
  message?: JsonlMessage;
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  timestamp?: string;
}

// ── Detection ──────────────────────────────────────────────

/**
 * Detect if the input is Claude Code JSONL format.
 * JSONL files have one JSON object per line, with at least some
 * lines containing `"type":"user"` or `"type":"assistant"`.
 */
export function isJsonlFormat(input: string): boolean {
  const lines = input.trim().split('\n').slice(0, 10);
  if (lines.length === 0) return false;

  let jsonLineCount = 0;
  let conversationLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        jsonLineCount++;
        if (parsed.type === 'user' || parsed.type === 'assistant') {
          conversationLineCount++;
        }
      }
    } catch {
      // Not JSON — can't be JSONL
      return false;
    }
  }

  return jsonLineCount >= 1 && conversationLineCount >= 1;
}

/**
 * Detect if the input is plain-text conversation format.
 * Looks for patterns like "Human:", "User:", "Assistant:", "Claude:"
 */
export function isPlainTextConversation(input: string): boolean {
  const rolePattern = /^(Human|User|Assistant|Claude|AI|System)\s*:/im;
  const matches = input.match(new RegExp(rolePattern.source, 'gim'));
  return (matches?.length ?? 0) >= 2;
}

/**
 * Detect the conversation source type.
 */
export function detectSource(input: string): ConversationSource {
  if (isJsonlFormat(input)) return 'claude-code';

  const lower = input.toLowerCase();
  if (lower.includes('codex') || lower.includes('openai')) return 'codex';

  return 'generic';
}

// ── JSONL Parser ───────────────────────────────────────────

/**
 * Extract text content from a JSONL message content field.
 * Handles both string content and content block arrays.
 */
function extractTextFromContent(content: string | JsonlContentBlock[]): string {
  if (typeof content === 'string') return content;

  if (!Array.isArray(content)) return '';

  return content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text!)
    .join('\n');
}

/**
 * Parse Claude Code JSONL transcript into messages.
 */
export function parseJsonlTranscript(input: string): ConversationParseResult {
  const lines = input.trim().split('\n');
  const messages: ParsedMessage[] = [];
  let sessionId: string | undefined;
  let projectDir: string | undefined;
  let gitBranch: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry: JsonlEntry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }

    // Extract metadata from first user message
    if (!sessionId && entry.sessionId) sessionId = entry.sessionId;
    if (!projectDir && entry.cwd) projectDir = entry.cwd;
    if (!gitBranch && entry.gitBranch) gitBranch = entry.gitBranch;

    // Skip non-conversation entries
    if (entry.type !== 'user' && entry.type !== 'assistant') continue;

    // Skip system/error messages
    if (entry.subtype === 'api_error' || entry.subtype === 'turn_duration') continue;

    // Skip tool_result messages from user (they're internal)
    if (entry.type === 'user' && entry.message?.content) {
      if (Array.isArray(entry.message.content)) {
        const hasOnlyToolResults = entry.message.content.every(
          (block) => block.type === 'tool_result'
        );
        if (hasOnlyToolResults) continue;
      }
    }

    // Skip assistant messages that are only tool_use blocks
    if (entry.type === 'assistant' && entry.message?.content) {
      if (Array.isArray(entry.message.content)) {
        const hasOnlyToolUse = entry.message.content.every(
          (block) => block.type === 'tool_use'
        );
        if (hasOnlyToolUse) continue;
      }
    }

    // Skip API error synthetic messages
    if (entry.type === 'assistant') {
      const jsonlEntry = entry as JsonlEntry & { isApiErrorMessage?: boolean };
      if (jsonlEntry.isApiErrorMessage) continue;
    }

    if (!entry.message) continue;

    const text = extractTextFromContent(entry.message.content);
    if (!text.trim()) continue;

    // Skip very short interrupt messages
    if (text.trim() === '[Request interrupted by user for tool use]') continue;
    if (text.trim() === 'continue') continue;

    const role: 'human' | 'assistant' = entry.type === 'user' ? 'human' : 'assistant';

    messages.push({
      role,
      text: text.trim(),
      timestamp: entry.timestamp,
    });
  }

  const markdown = buildMarkdown(messages, {
    source: 'claude-code',
    sessionId,
    projectDir,
    gitBranch,
  });

  return {
    source: 'claude-code',
    messages,
    sessionId,
    projectDir,
    gitBranch,
    markdown,
  };
}

// ── Plain Text Parser ──────────────────────────────────────

/**
 * Parse plain text conversation (Human:/Assistant: format).
 */
export function parsePlainTextConversation(input: string): ConversationParseResult {
  const messages: ParsedMessage[] = [];
  const rolePattern = /^(Human|User|Assistant|Claude|AI)\s*:\s*/im;

  // Split on role markers while keeping the marker
  const parts = input.split(/(?=^(?:Human|User|Assistant|Claude|AI)\s*:)/im);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const match = trimmed.match(rolePattern);
    if (!match) {
      // If no role marker, this is preamble text — skip
      continue;
    }

    const roleLabel = match[1].toLowerCase();
    const role: 'human' | 'assistant' =
      roleLabel === 'human' || roleLabel === 'user' ? 'human' : 'assistant';

    const text = trimmed.slice(match[0].length).trim();
    if (!text) continue;

    messages.push({ role, text });
  }

  const source = detectSource(input);
  const markdown = buildMarkdown(messages, { source });

  return { source, messages, markdown };
}

// ── Markdown Builder ───────────────────────────────────────

interface MarkdownOptions {
  source: ConversationSource;
  sessionId?: string;
  projectDir?: string;
  gitBranch?: string;
}

/**
 * Build import-ready markdown from parsed messages.
 *
 * The markdown is structured to work well with the AI import pipeline,
 * highlighting decisions, tasks, features, and technical details.
 */
function buildMarkdown(messages: ParsedMessage[], options: MarkdownOptions): string {
  const sections: string[] = [];

  // Header
  const sourceLabel =
    options.source === 'claude-code'
      ? 'Claude Code'
      : options.source === 'codex'
        ? 'Codex'
        : 'AI Conversation';

  sections.push(`# ${sourceLabel} Session Import`);
  sections.push('');

  if (options.sessionId) {
    sections.push(`> Session: \`${options.sessionId}\``);
  }
  if (options.projectDir) {
    sections.push(`> Project: \`${options.projectDir}\``);
  }
  if (options.gitBranch) {
    sections.push(`> Branch: \`${options.gitBranch}\``);
  }
  if (options.sessionId || options.projectDir || options.gitBranch) {
    sections.push('');
  }

  // Extract key content from the conversation
  const humanMessages = messages.filter((m) => m.role === 'human');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Description from first human message
  if (humanMessages.length > 0) {
    sections.push('## Description');
    sections.push('');
    // Use first human message as the project description/context
    const firstMsg = humanMessages[0].text;
    const descriptionText = firstMsg.length > 2000 ? firstMsg.slice(0, 2000) + '...' : firstMsg;
    sections.push(descriptionText);
    sections.push('');
  }

  // Extract features and tasks mentioned across all messages
  const allText = messages.map((m) => m.text).join('\n');
  const extractedFeatures = extractFeatureMentions(allText);
  const extractedTech = extractTechMentions(allText);
  const extractedTasks = extractTaskMentions(allText);

  if (extractedFeatures.length > 0) {
    sections.push('## Features');
    sections.push('');
    for (const feature of extractedFeatures) {
      sections.push(`- ${feature}`);
    }
    sections.push('');
  }

  if (extractedTech.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');
    for (const tech of extractedTech) {
      sections.push(`- ${tech}`);
    }
    sections.push('');
  }

  if (extractedTasks.length > 0) {
    sections.push('## Tasks');
    sections.push('');
    for (const task of extractedTasks) {
      sections.push(`- ${task}`);
    }
    sections.push('');
  }

  // Include key conversation excerpts
  sections.push('## Conversation Summary');
  sections.push('');

  // Include up to 10 most substantive assistant messages
  const substantiveMessages = assistantMessages
    .filter((m) => m.text.length > 100)
    .slice(0, 10);

  for (const msg of substantiveMessages) {
    const excerpt = msg.text.length > 1500 ? msg.text.slice(0, 1500) + '...' : msg.text;
    sections.push(excerpt);
    sections.push('');
  }

  // If no substantive assistant messages, include human messages
  if (substantiveMessages.length === 0 && humanMessages.length > 0) {
    for (const msg of humanMessages.slice(0, 5)) {
      const excerpt = msg.text.length > 1500 ? msg.text.slice(0, 1500) + '...' : msg.text;
      sections.push(excerpt);
      sections.push('');
    }
  }

  return sections.join('\n').trim();
}

// ── Content Extractors ─────────────────────────────────────

/**
 * Extract feature-like mentions from conversation text.
 * Looks for bullet points under "features" headings and explicit feature mentions.
 */
function extractFeatureMentions(text: string): string[] {
  const features: string[] = [];
  const seen = new Set<string>();

  // Look for bullet items under feature-related headings
  const featureSection = text.match(
    /(?:features?|functionality|capabilities|requirements)\s*:?\s*\n((?:\s*[-*]\s*.+\n?)+)/gi
  );

  if (featureSection) {
    for (const section of featureSection) {
      const bullets = section.match(/[-*]\s+(.+)/g);
      if (bullets) {
        for (const bullet of bullets) {
          const cleaned = bullet.replace(/^[-*]\s+/, '').trim();
          const key = cleaned.toLowerCase();
          if (cleaned.length > 3 && cleaned.length < 200 && !seen.has(key)) {
            seen.add(key);
            features.push(cleaned);
          }
        }
      }
    }
  }

  // Look for numbered items under feature headings
  const numberedSection = text.match(
    /(?:features?|functionality|capabilities)\s*:?\s*\n((?:\s*\d+[.)]\s*.+\n?)+)/gi
  );

  if (numberedSection) {
    for (const section of numberedSection) {
      const items = section.match(/\d+[.)]\s+(.+)/g);
      if (items) {
        for (const item of items) {
          const cleaned = item.replace(/^\d+[.)]\s+/, '').trim();
          const key = cleaned.toLowerCase();
          if (cleaned.length > 3 && cleaned.length < 200 && !seen.has(key)) {
            seen.add(key);
            features.push(cleaned);
          }
        }
      }
    }
  }

  return features.slice(0, 20);
}

/**
 * Extract technology mentions from conversation text.
 */
function extractTechMentions(text: string): string[] {
  const techPatterns = [
    /\b(React|Next\.js|Vue|Angular|Svelte|Remix|Astro)\b/gi,
    /\b(Node\.js|Express|Fastify|Hono|Bun|Deno)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|SQLite|Supabase|Firebase|Prisma|Drizzle)\b/gi,
    /\b(TypeScript|JavaScript|Python|Rust|Go|Ruby)\b/gi,
    /\b(Tailwind(?:\s+CSS)?|shadcn|Radix|Chakra|MUI)\b/gi,
    /\b(AWS|GCP|Azure|Vercel|Netlify|Cloudflare)\b/gi,
    /\b(Docker|Kubernetes|Terraform|GitHub\s+Actions)\b/gi,
    /\b(Vitest|Jest|Playwright|Cypress)\b/gi,
    /\b(Zustand|Redux|Jotai|Recoil)\b/gi,
    /\b(OpenAI|Anthropic|Claude|GPT-4)\b/gi,
  ];

  const seen = new Set<string>();
  const techs: string[] = [];

  for (const pattern of techPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const tech = match[1];
      const key = tech.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        techs.push(tech);
      }
    }
  }

  return techs.slice(0, 15);
}

/**
 * Extract task-like items from conversation text.
 * Looks for TODO items, action items, and task lists.
 */
function extractTaskMentions(text: string): string[] {
  const tasks: string[] = [];
  const seen = new Set<string>();

  // Match TODO/FIXME/HACK comments
  const todoPattern = /(?:TODO|FIXME|HACK|NOTE)\s*:?\s*(.+)/gi;
  const todoMatches = text.matchAll(todoPattern);
  for (const match of todoMatches) {
    const task = match[1].trim();
    const key = task.toLowerCase();
    if (task.length > 5 && task.length < 200 && !seen.has(key)) {
      seen.add(key);
      tasks.push(task);
    }
  }

  // Match checkbox items
  const checkboxPattern = /\[[ x]\]\s+(.+)/gi;
  const checkboxMatches = text.matchAll(checkboxPattern);
  for (const match of checkboxMatches) {
    const task = match[1].trim();
    const key = task.toLowerCase();
    if (task.length > 5 && task.length < 200 && !seen.has(key)) {
      seen.add(key);
      tasks.push(task);
    }
  }

  return tasks.slice(0, 15);
}

// ── Public API ─────────────────────────────────────────────

/**
 * Parse any conversation input (JSONL or plain text) into import-ready markdown.
 * This is the main entry point for the conversation import feature.
 */
export function parseConversation(input: string): ConversationParseResult {
  if (!input || !input.trim()) {
    return {
      source: 'generic',
      messages: [],
      markdown: '',
    };
  }

  if (isJsonlFormat(input)) {
    return parseJsonlTranscript(input);
  }

  if (isPlainTextConversation(input)) {
    return parsePlainTextConversation(input);
  }

  // Fallback: treat entire input as a single human message
  const messages: ParsedMessage[] = [
    { role: 'human', text: input.trim() },
  ];

  const markdown = buildMarkdown(messages, { source: 'generic' });

  return {
    source: 'generic',
    messages,
    markdown,
  };
}
