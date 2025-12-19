'use client';

import { useState } from 'react';

type Props = {
  value: string;
  ariaLabel?: string;
};

export function CopyToClipboard({ value, ariaLabel }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel ?? 'In Zwischenablage kopieren'}
      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
    >
      {copied ? 'Kopiert' : 'Kopieren'}
    </button>
  );
}
