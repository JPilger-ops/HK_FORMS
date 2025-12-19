'use client';

import { useState, useTransition } from 'react';
import { testSmtpSettingsAction } from '@/server/actions/settings';

export function SmtpTestButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTest = () => {
    setResult(null);
    startTransition(async () => {
      const response = await testSmtpSettingsAction();
      if (response?.success) {
        setResult({ type: 'success', text: response.message });
      } else {
        setResult({
          type: 'error',
          text: response?.message ?? 'SMTP Test fehlgeschlagen'
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={isPending}
        className="rounded border border-brand bg-white px-3 py-2 text-sm font-medium text-brand shadow-sm disabled:opacity-60"
      >
        {isPending ? 'Test läuft…' : 'SMTP testen'}
      </button>
      {result && (
        <p
          className={`rounded p-2 text-xs ${
            result.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
