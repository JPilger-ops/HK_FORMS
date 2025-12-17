import { ReactNode } from 'react';
import { AdminHeader } from './admin-header';
import { getAutoLogoutMinutes } from '@/lib/config';

export function AdminShell({ children }: { children: ReactNode }) {
  const autoLogoutMinutes = getAutoLogoutMinutes();
  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <AdminHeader autoLogoutMinutes={autoLogoutMinutes} />
      </header>
      <div className="rounded bg-white p-6 shadow">{children}</div>
    </div>
  );
}
