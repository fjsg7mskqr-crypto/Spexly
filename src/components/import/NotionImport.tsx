'use client';

import { useState, useEffect } from 'react';
import {
  listNotionPages,
  importNotionPage,
  checkNotionConnection,
  disconnectNotion,
} from '@/app/actions/notionIntegration';

interface NotionPage {
  id: string;
  title: string;
  url: string;
}

export function NotionImport({ onImport }: { onImport: (content: string, title: string) => void }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setLoading(true);
    const result = await checkNotionConnection();
    setConnected(result.connected);
    if (result.connected) {
      await loadPages();
    }
    setLoading(false);
  }

  async function loadPages() {
    const result = await listNotionPages();
    if (result.success && result.pages) {
      setPages(result.pages);
    }
  }

  async function handleImport(pageId: string, title: string) {
    setImporting(true);
    const result = await importNotionPage(pageId);
    if (result.success && result.content) {
      onImport(result.content, result.title || title);
    } else {
      alert(`Failed to import: ${result.error || 'Unknown error'}`);
    }
    setImporting(false);
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Notion?')) return;
    const result = await disconnectNotion();
    if (result.success) {
      setConnected(false);
      setPages([]);
    }
  }

  function handleConnect() {
    // Redirect to Notion OAuth
    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/integrations/notion/callback`;
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    window.location.href = authUrl;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center p-8">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.214V6.354c0-.653-.28-.934-.748-1.026l-15.177-.887c-.467-.046-.747.28-.747.847zm14.336.653c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.934l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">Connect Notion</h3>
        <p className="text-sm text-slate-400 mb-4">Import PRDs and project docs directly from Notion</p>
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          Connect Notion Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Notion Connected
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {pages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No recent pages found</p>
        ) : (
          pages.map((page) => (
            <button
              key={page.id}
              onClick={() => handleImport(page.id, page.title)}
              disabled={importing}
              className="w-full text-left p-3 rounded-lg border border-slate-700 hover:border-violet-500 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{page.title}</p>
                  <p className="text-xs text-slate-500 truncate">{page.url}</p>
                </div>
                <svg
                  className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
