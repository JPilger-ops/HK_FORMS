'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';

type Props = {
  autoLogoutMinutes: number;
};

function AutoLogout({ minutes }: { minutes: number }) {
  useEffect(() => {
    const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
    const timeoutMs = safeMinutes * 60 * 1000;
    const storageKey = 'hkforms:last-activity';
    let signedOut = false;
    let lastActivity = Date.now();

    const writeActivity = (value: number) => {
      lastActivity = value;
      try {
        localStorage.setItem(storageKey, String(value));
      } catch (error) {
        console.warn('Could not persist activity timestamp', error);
      }
    };

    const readActivity = () => {
      try {
        const stored = Number(localStorage.getItem(storageKey));
        return Number.isFinite(stored) ? stored : lastActivity;
      } catch {
        return lastActivity;
      }
    };

    const signOutNow = () => {
      if (signedOut) return;
      signedOut = true;
      signOut({ callbackUrl: '/admin/login' });
    };

    const checkIdle = () => {
      const last = readActivity();
      if (Date.now() - last >= timeoutMs) {
        signOutNow();
      }
    };

    const noteActivity = () => {
      if (signedOut) return;
      writeActivity(Date.now());
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
        noteActivity();
      }
    };

    writeActivity(lastActivity);

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'focus',
      'touchstart'
    ];
    events.forEach((evt) => window.addEventListener(evt, noteActivity));
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey && event.newValue) {
        const parsed = Number(event.newValue);
        if (Number.isFinite(parsed)) {
          lastActivity = parsed;
          checkIdle();
        }
      }
    });

    const interval = window.setInterval(
      checkIdle,
      Math.min(60000, Math.max(5000, Math.floor(timeoutMs / 4)))
    );
    checkIdle();

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, noteActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [minutes]);

  return null;
}

export function AdminHeader({ autoLogoutMinutes }: Props) {
  const { data } = useSession();
  const userLabel = useMemo(
    () => data?.user?.email ?? data?.user?.id ?? '',
    [data?.user?.email, data?.user?.id]
  );
  const isAdmin = data?.user?.role === 'ADMIN';
  const navButtonClasses =
    'inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.4)] ring-1 ring-brand/40 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.45)] active:translate-y-0';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Waldwirtschaft Heidekönig</p>
        <h1 className="text-2xl font-semibold text-brand">Adminpanel</h1>
        <p className="text-xs text-slate-500">
          Auto-Logout nach {autoLogoutMinutes} min Inaktivität.
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <nav className="flex flex-wrap items-center justify-end gap-2 rounded-full bg-white/30 px-2 py-1 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
          <Link href="/admin/requests" className={navButtonClasses}>
            Anfragen
          </Link>
          <Link href="/admin/invites" className={navButtonClasses}>
            Einladungen
          </Link>
          {isAdmin && (
            <Link href="/admin/settings" className={navButtonClasses}>
              Einstellungen
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/users" className={navButtonClasses}>
              Benutzer
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className={`inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.4)] ring-1 ring-red-500/50 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.45)] active:translate-y-0`}
          >
            Logout {userLabel ? `(${userLabel})` : ''}
          </button>
        </nav>
      </div>
      <AutoLogout minutes={autoLogoutMinutes} />
    </div>
  );
}
