'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Code, CheckSquare, Sparkles } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { generateContextFile } from '@/lib/export/contextFileGenerator';
import { generateFeaturePrompt, generateCursorPlanPrompt, generateFullStackPrompt } from '@/lib/export/promptGenerator';
import { generateTodoMarkdown, generateGitHubIssues } from '@/lib/export/todoMarkdownGenerator';

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nodes = useCanvasStore((s) => s.nodes);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const copyToClipboard = async (content: string, message: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(message);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopiedMessage('Failed to copy');
      setTimeout(() => setCopiedMessage(null), 2000);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedMessage(`Downloaded ${filename}`);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const handleExportContextFile = () => {
    const content = generateContextFile(nodes);
    downloadFile(content, '.context-index.md');
    setIsOpen(false);
  };

  const handleExportClaudePrompt = () => {
    const featureNodes = nodes.filter((n) => n.type === 'feature');
    if (featureNodes.length === 0) {
      setCopiedMessage('No features to export');
      setTimeout(() => setCopiedMessage(null), 2000);
      return;
    }

    // Generate prompt for first planned/in-progress feature
    const targetFeature = featureNodes.find(
      (n) => n.type === 'feature' && (n.data.status === 'Planned' || n.data.status === 'In Progress')
    ) || featureNodes[0];

    if (!targetFeature) return;

    const content = generateFeaturePrompt(targetFeature, nodes);
    copyToClipboard(content, 'Claude prompt copied!');
    setIsOpen(false);
  };

  const handleExportCursorPrompt = () => {
    const featureNodes = nodes.filter((n) => n.type === 'feature');
    if (featureNodes.length === 0) {
      setCopiedMessage('No features to export');
      setTimeout(() => setCopiedMessage(null), 2000);
      return;
    }

    const targetFeature = featureNodes.find(
      (n) => n.type === 'feature' && (n.data.status === 'Planned' || n.data.status === 'In Progress')
    ) || featureNodes[0];

    if (!targetFeature) return;

    const content = generateCursorPlanPrompt(targetFeature, nodes);
    copyToClipboard(content, 'Cursor prompt copied!');
    setIsOpen(false);
  };

  const handleExportFullStackPrompt = () => {
    const content = generateFullStackPrompt(nodes);
    copyToClipboard(content, 'Full-stack prompt copied!');
    setIsOpen(false);
  };

  const handleExportTodoMarkdown = () => {
    const content = generateTodoMarkdown(nodes);
    downloadFile(content, 'TODO.md');
    setIsOpen(false);
  };

  const handleExportGitHubIssues = () => {
    const issues = generateGitHubIssues(nodes);
    const content = JSON.stringify(issues, null, 2);
    downloadFile(content, 'github-issues.json');
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-violet-400/50 bg-violet-400/10 px-3 py-1.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-400/20"
      >
        <Download size={16} />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-white/10 bg-slate-800 shadow-xl">
          <div className="border-b border-white/5 p-3">
            <h3 className="text-sm font-semibold text-white">Export Options</h3>
            <p className="mt-1 text-xs text-slate-400">
              Generate AI-ready context and implementation guides
            </p>
          </div>

          <div className="p-2">
            <button
              onClick={handleExportContextFile}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <FileText size={18} className="mt-0.5 shrink-0 text-violet-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Context File (.context/index.md)</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Persistent context file for AI coding assistants
                </div>
              </div>
            </button>

            <button
              onClick={handleExportClaudePrompt}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <Sparkles size={18} className="mt-0.5 shrink-0 text-violet-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Claude Code Prompt</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Optimized prompt for next feature (copied to clipboard)
                </div>
              </div>
            </button>

            <button
              onClick={handleExportCursorPrompt}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <Code size={18} className="mt-0.5 shrink-0 text-blue-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Cursor Plan Mode Prompt</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Plan format for Cursor AI (copied to clipboard)
                </div>
              </div>
            </button>

            <button
              onClick={handleExportFullStackPrompt}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <Code size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Bolt/Lovable Full Prompt</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Complete project prompt for full-stack generators
                </div>
              </div>
            </button>

            <button
              onClick={handleExportTodoMarkdown}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <CheckSquare size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">TODO.md</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Markdown task list organized by status
                </div>
              </div>
            </button>

            <button
              onClick={handleExportGitHubIssues}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-700/50"
            >
              <FileText size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">GitHub Issues (JSON)</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Import-ready issue definitions
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {copiedMessage && (
        <div className="absolute right-0 top-full mt-2 rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
          {copiedMessage}
        </div>
      )}
    </div>
  );
}
