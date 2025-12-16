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
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        signOut({ callbackUrl: '/admin/login' });
      }, timeoutMs);
    };

    const reset = () => schedule();
    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'focus'
    ];
    events.forEach((evt) => window.addEventListener(evt, reset));
    schedule();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, reset));
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
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <Link href="/admin/requests" className="text-brand hover:underline">
            Anfragen
          </Link>
          <Link href="/admin/invites" className="text-brand hover:underline">
            Einladungen
          </Link>
          <Link href="/admin/users" className="text-brand hover:underline">
            Benutzer
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 transition hover:bg-slate-100"
          >
            Logout {userLabel ? `(${userLabel})` : ''}
          </button>
        </nav>
      </div>
      <AutoLogout minutes={autoLogoutMinutes} />
    </div>
  );
}
