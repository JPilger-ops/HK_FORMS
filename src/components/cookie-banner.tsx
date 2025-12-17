'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'hk_consent';

function hasConsent() {
  if (typeof document === 'undefined') return true;
  return document.cookie.includes(`${CONSENT_KEY}=`);
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      setVisible(true);
    }
  }, []);

  const storeConsent = (value: 'accepted' | 'declined') => {
    const payload = `${CONSENT_KEY}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    document.cookie = payload;
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ value, timestamp: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-2 text-sm text-slate-700">
        <p>
          Wir verwenden nur technisch notwendige Cookies für Login und Sitzungsverwaltung. Weitere
          optionale Skripte sind deaktiviert.
        </p>
        <p className="text-xs text-slate-600">
          Details unter{' '}
          <Link href="/datenschutz" className="text-brand underline">
            Datenschutz
          </Link>{' '}
          und{' '}
          <Link href="/cookies" className="text-brand underline">
            Cookie-Richtlinie
          </Link>
          .
        </p>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => storeConsent('declined')}
          className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          Ablehnen
        </button>
        <button
          type="button"
          onClick={() => storeConsent('accepted')}
          className="rounded bg-brand px-4 py-1 text-sm text-white hover:bg-brand-light"
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
