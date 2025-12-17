import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';

export default async function SettingsPage() {
  await assertPermission('manage:settings');

  return (
    <AdminShell>
      <h2 className="text-xl font-semibold">Einstellungen</h2>
      <p className="text-sm text-slate-500">
        Konfiguration für öffentliches Formular, Extras und rechtliche Seiten.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>
          <Link href="/admin/settings/formular" className="text-brand underline">
            Formular & Extras
          </Link>
        </li>
        <li>
          <Link href="/admin/settings/bedingungen" className="text-brand underline">
            Reservierungsbedingungen
          </Link>
        </li>
        <li>
          <Link href="/admin/settings/deposit" className="text-brand underline">
            Anzahlung
          </Link>
        </li>
      </ul>
    </AdminShell>
  );
}
