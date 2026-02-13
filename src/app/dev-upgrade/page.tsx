'use client';

import { useState } from 'react';
import { upgradeCurrentUserToPro } from '@/app/actions/upgradeToProDEV';

export default function DevUpgradePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    setResult(null);

    try {
      const response = await upgradeCurrentUserToPro();
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-white">
          🚀 Dev: Upgrade to Pro
        </h1>

        <p className="mb-6 text-sm text-slate-400">
          Click the button below to upgrade your account to Pro tier.
        </p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Upgrading...' : 'Upgrade to Pro'}
        </button>

        {result && (
          <div
            className={`mt-6 rounded-lg border p-4 ${
              result.success
                ? 'border-green-500/20 bg-green-500/10 text-green-200'
                : 'border-red-500/20 bg-red-500/10 text-red-200'
            }`}
          >
            <p className="font-medium">
              {result.success ? '✅ Success!' : '❌ Error'}
            </p>
            <p className="mt-2 text-sm">
              {result.message || result.error}
            </p>
            {result.userId && (
              <p className="mt-2 text-xs opacity-70">
                User ID: {result.userId}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 text-xs text-slate-500">
          ⚠️ DEV ONLY - Remove before production
        </div>
      </div>
    </div>
  );
}
