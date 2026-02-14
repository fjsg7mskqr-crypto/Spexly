'use client';

import { useState, useRef } from 'react';
import { parseConversation, type ConversationParseResult } from '@/lib/import/conversationParser';

interface ConversationImportProps {
  onImport: (content: string, title: string) => void;
}

export function ConversationImport({ onImport }: ConversationImportProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ConversationParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTextChange(value: string) {
    setText(value);
    if (value.trim()) {
      const result = parseConversation(value);
      setPreview(result);
    } else {
      setPreview(null);
    }
  }

  function handleImport() {
    if (!preview || !preview.markdown) return;
    setImporting(true);

    const sourceLabel =
      preview.source === 'claude-code'
        ? 'Claude Code Session'
        : preview.source === 'codex'
          ? 'Codex Session'
          : 'AI Conversation';

    onImport(preview.markdown, sourceLabel);
    setImporting(false);
  }

  async function handleFile(file: File) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    const content = await file.text();
    handleTextChange(content);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  const sourceLabel =
    preview?.source === 'claude-code'
      ? 'Claude Code'
      : preview?.source === 'codex'
        ? 'Codex'
        : 'AI Conversation';

  return (
    <div className="space-y-4">
      {/* File upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jsonl,.txt,.md,.json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all
          ${dragActive ? 'border-violet-500 bg-violet-500/10' : 'border-slate-600 hover:border-slate-500'}
        `}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Drop a .jsonl transcript or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Claude Code transcripts from ~/.claude/projects/
            </p>
          </div>
        </div>
      </div>

      {/* Paste area */}
      <div>
        <label className="block text-sm text-slate-300 mb-1.5">
          Or paste your conversation below
        </label>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={`Paste a Claude Code JSONL transcript, or a conversation in this format:\n\nHuman: Build a login page with email and password\nAssistant: I'll create a login page component...`}
          rows={8}
          className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
        />
      </div>

      {/* Preview */}
      {preview && preview.messages.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-slate-200">
                {sourceLabel} Detected
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {preview.messages.length} message{preview.messages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {preview.sessionId && (
            <p className="text-xs text-slate-500">
              Session: <code className="text-violet-300">{preview.sessionId.slice(0, 8)}...</code>
            </p>
          )}

          {preview.projectDir && (
            <p className="text-xs text-slate-500">
              Project: <code className="text-violet-300">{preview.projectDir}</code>
            </p>
          )}

          <div className="flex gap-3 text-xs text-slate-400">
            <span>
              {preview.messages.filter((m) => m.role === 'human').length} human
            </span>
            <span>
              {preview.messages.filter((m) => m.role === 'assistant').length} assistant
            </span>
          </div>
        </div>
      )}

      {/* Import button */}
      {preview && preview.messages.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Will extract features, tech stack, and tasks from the conversation.
          </p>
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
          >
            {importing ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : null}
            {importing ? 'Importing...' : 'Import Conversation'}
          </button>
        </div>
      )}

      {/* Help text */}
      <div className="space-y-2 border-t border-white/5 pt-3">
        <p className="text-xs font-medium text-slate-400">Supported formats:</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Claude Code (.jsonl)
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Plain text conversations
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Copy-paste from terminal
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Codex conversations
          </div>
        </div>
      </div>
    </div>
  );
}
