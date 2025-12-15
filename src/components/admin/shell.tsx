import Link from 'next/link';
import { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Waldwirtschaft Heidekönig</p>
          <h1 className="text-2xl font-semibold text-brand">Adminpanel</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/requests" className="text-brand hover:underline">
            Anfragen
          </Link>
          <Link href="/admin/users" className="text-brand hover:underline">
            Benutzer
          </Link>
        </nav>
      </header>
      <div className="rounded bg-white p-6 shadow">{children}</div>
    </div>
  );
}
