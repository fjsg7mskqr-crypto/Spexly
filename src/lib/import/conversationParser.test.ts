import { describe, it, expect } from 'vitest';
import {
  parseConversation,
  parseJsonlTranscript,
  parsePlainTextConversation,
  isJsonlFormat,
  isPlainTextConversation,
  detectSource,
} from './conversationParser';

// ── Test fixtures ──────────────────────────────────────────

const JSONL_TRANSCRIPT = [
  JSON.stringify({
    type: 'file-history-snapshot',
    messageId: 'abc',
    snapshot: { messageId: 'abc', trackedFileBackups: {}, timestamp: '2026-02-13T00:22:54.038Z' },
    isSnapshotUpdate: false,
  }),
  JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: 'Build a login page with email and password authentication using NextAuth.js and Supabase',
    },
    sessionId: 'session-123',
    cwd: '/Users/dev/myapp',
    gitBranch: 'main',
    timestamp: '2026-02-13T00:23:00.000Z',
    uuid: 'msg-1',
  }),
  JSON.stringify({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "I'll create a login page with email/password auth. Let me start by setting up the components and API routes.\n\n## Features\n- Email/password login\n- Password validation\n- Error handling\n- Session management",
        },
      ],
    },
    sessionId: 'session-123',
    timestamp: '2026-02-13T00:23:05.000Z',
    uuid: 'msg-2',
  }),
  JSON.stringify({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Write',
          input: { file_path: '/src/app/login/page.tsx', content: 'export default function LoginPage() {}' },
        },
      ],
    },
    sessionId: 'session-123',
    timestamp: '2026-02-13T00:23:10.000Z',
    uuid: 'msg-3',
  }),
  JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tool-1', content: 'File created' }],
    },
    sessionId: 'session-123',
    timestamp: '2026-02-13T00:23:11.000Z',
    uuid: 'msg-4',
  }),
  JSON.stringify({
    type: 'system',
    subtype: 'api_error',
    cause: { code: 'ConnectionRefused' },
    sessionId: 'session-123',
    timestamp: '2026-02-13T00:23:15.000Z',
    uuid: 'msg-5',
  }),
  JSON.stringify({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'The login page is ready. I also added React, Tailwind CSS, and NextAuth.js integration.',
        },
      ],
    },
    sessionId: 'session-123',
    timestamp: '2026-02-13T00:23:20.000Z',
    uuid: 'msg-6',
  }),
].join('\n');

const PLAIN_TEXT_CONVERSATION = [
  'Human: I need to build a project management dashboard with React and TypeScript.',
  '',
  'Features:',
  '- Task board with drag and drop',
  '- User authentication',
  '- Real-time updates',
  '- Analytics dashboard',
  '',
  'Assistant: I can help you build that! Let me plan the architecture.',
  '',
  'The tech stack will include:',
  '- React with TypeScript',
  '- Tailwind CSS for styling',
  '- Supabase for the database',
  '- Zustand for state management',
  '',
  'Human: Sounds great. Please start with the task board feature.',
  '',
  'Assistant: I will implement the task board with drag and drop using @dnd-kit library.',
].join('\n');

const GENERIC_TEXT = 'This is a random document that is not a conversation format at all. It has some ideas about building a web app with Node.js and PostgreSQL.';

// ── Detection tests ────────────────────────────────────────

describe('isJsonlFormat', () => {
  it('detects valid JSONL transcript', () => {
    expect(isJsonlFormat(JSONL_TRANSCRIPT)).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isJsonlFormat(PLAIN_TEXT_CONVERSATION)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isJsonlFormat('')).toBe(false);
  });

  it('rejects JSON that is not conversation format', () => {
    const jsonLines = '{"key": "value"}\n{"key2": "value2"}';
    expect(isJsonlFormat(jsonLines)).toBe(false);
  });
});

describe('isPlainTextConversation', () => {
  it('detects Human/Assistant format', () => {
    expect(isPlainTextConversation(PLAIN_TEXT_CONVERSATION)).toBe(true);
  });

  it('detects User/Claude format', () => {
    const text = 'User: Hello\nClaude: Hi there!';
    expect(isPlainTextConversation(text)).toBe(true);
  });

  it('rejects generic text', () => {
    expect(isPlainTextConversation(GENERIC_TEXT)).toBe(false);
  });

  it('rejects JSONL', () => {
    expect(isPlainTextConversation(JSONL_TRANSCRIPT)).toBe(false);
  });
});

describe('detectSource', () => {
  it('detects claude-code from JSONL', () => {
    expect(detectSource(JSONL_TRANSCRIPT)).toBe('claude-code');
  });

  it('detects generic from plain text', () => {
    expect(detectSource(PLAIN_TEXT_CONVERSATION)).toBe('generic');
  });

  it('detects codex when mentioned', () => {
    const text = 'This is a codex conversation about building an app';
    expect(detectSource(text)).toBe('codex');
  });
});

// ── JSONL Parser tests ─────────────────────────────────────

describe('parseJsonlTranscript', () => {
  it('extracts human and assistant messages', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    // 1 human + 2 assistant text messages (tool_use/tool_result/system skipped)
    expect(result.messages.length).toBe(3);
    expect(result.messages[0].role).toBe('human');
    expect(result.messages[1].role).toBe('assistant');
    expect(result.messages[2].role).toBe('assistant');
  });

  it('extracts session metadata', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    expect(result.sessionId).toBe('session-123');
    expect(result.projectDir).toBe('/Users/dev/myapp');
    expect(result.gitBranch).toBe('main');
  });

  it('skips tool_use-only assistant messages', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    // The tool_use-only message should be skipped, but both text messages remain
    const assistantMessages = result.messages.filter((m) => m.role === 'assistant');
    expect(assistantMessages.length).toBe(2);
    expect(assistantMessages[0].text).toContain("I'll create a login page");
    expect(assistantMessages[1].text).toContain('The login page is ready');
  });

  it('skips tool_result-only user messages', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    const humanMessages = result.messages.filter((m) => m.role === 'human');
    // Only the actual user text message, not the tool_result
    expect(humanMessages.length).toBe(1);
    expect(humanMessages[0].text).toContain('Build a login page');
  });

  it('skips system error messages', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    // System messages should not appear in messages
    const allTexts = result.messages.map((m) => m.text).join(' ');
    expect(allTexts).not.toContain('ConnectionRefused');
  });

  it('sets source to claude-code', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    expect(result.source).toBe('claude-code');
  });

  it('produces non-empty markdown', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    expect(result.markdown).toBeTruthy();
    expect(result.markdown).toContain('Claude Code Session Import');
  });

  it('includes session metadata in markdown', () => {
    const result = parseJsonlTranscript(JSONL_TRANSCRIPT);
    expect(result.markdown).toContain('session-123');
    expect(result.markdown).toContain('/Users/dev/myapp');
    expect(result.markdown).toContain('main');
  });

  it('handles empty input', () => {
    const result = parseJsonlTranscript('');
    expect(result.messages).toHaveLength(0);
  });

  it('handles malformed JSONL lines gracefully', () => {
    const input = [
      '{"type":"user","message":{"role":"user","content":"Hello"}}',
      'this is not json',
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}]}}',
    ].join('\n');
    const result = parseJsonlTranscript(input);
    expect(result.messages).toHaveLength(2);
  });
});

// ── Plain Text Parser tests ────────────────────────────────

describe('parsePlainTextConversation', () => {
  it('extracts human and assistant messages', () => {
    const result = parsePlainTextConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.messages.length).toBe(4);
    expect(result.messages[0].role).toBe('human');
    expect(result.messages[1].role).toBe('assistant');
    expect(result.messages[2].role).toBe('human');
    expect(result.messages[3].role).toBe('assistant');
  });

  it('handles User/Claude format', () => {
    const text = 'User: Build a todo app\nClaude: I will build a todo app with React.';
    const result = parsePlainTextConversation(text);
    expect(result.messages.length).toBe(2);
    expect(result.messages[0].role).toBe('human');
    expect(result.messages[0].text).toBe('Build a todo app');
    expect(result.messages[1].role).toBe('assistant');
  });

  it('produces markdown output', () => {
    const result = parsePlainTextConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toBeTruthy();
    expect(result.markdown).toContain('Session Import');
  });
});

// ── Main parseConversation tests ───────────────────────────

describe('parseConversation', () => {
  it('returns empty result for empty input', () => {
    const result = parseConversation('');
    expect(result.messages).toHaveLength(0);
    expect(result.markdown).toBe('');
    expect(result.source).toBe('generic');
  });

  it('returns empty result for whitespace-only input', () => {
    const result = parseConversation('   \n  \n  ');
    expect(result.messages).toHaveLength(0);
    expect(result.markdown).toBe('');
  });

  it('auto-detects and parses JSONL', () => {
    const result = parseConversation(JSONL_TRANSCRIPT);
    expect(result.source).toBe('claude-code');
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.sessionId).toBe('session-123');
  });

  it('auto-detects and parses plain text conversation', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages[0].role).toBe('human');
  });

  it('handles generic text as single human message', () => {
    const result = parseConversation(GENERIC_TEXT);
    expect(result.source).toBe('generic');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('human');
    expect(result.messages[0].text).toBe(GENERIC_TEXT);
  });

  it('extracts tech mentions from conversation', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toContain('Tech Stack');
    expect(result.markdown).toContain('React');
  });

  it('extracts features from conversation', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toContain('Features');
    expect(result.markdown).toContain('Task board with drag and drop');
  });

  it('handles very long conversations by truncating', () => {
    const longMessage = 'A'.repeat(3000);
    const input = `Human: ${longMessage}\nAssistant: Got it.`;
    const result = parseConversation(input);
    // Should not crash and should produce output
    expect(result.markdown.length).toBeGreaterThan(0);
    expect(result.messages.length).toBe(2);
  });
});

// ── Markdown output quality tests ──────────────────────────

describe('markdown output', () => {
  it('includes conversation summary section', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toContain('## Conversation Summary');
  });

  it('includes description section from first human message', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toContain('## Description');
    expect(result.markdown).toContain('project management dashboard');
  });

  it('extracts feature bullet points', () => {
    const result = parseConversation(PLAIN_TEXT_CONVERSATION);
    expect(result.markdown).toContain('User authentication');
    expect(result.markdown).toContain('Real-time updates');
  });

  it('includes tech stack from conversation', () => {
    const result = parseConversation(JSONL_TRANSCRIPT);
    expect(result.markdown).toContain('Tech Stack');
  });
});
