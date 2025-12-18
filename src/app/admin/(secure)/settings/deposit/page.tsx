import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getDepositSettings } from '@/lib/settings';
import { updateDepositSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export default async function DepositSettingsPage() {
  await assertPermission('manage:settings');
  const { enabled, amount } = await getDepositSettings();

  async function save(formData: FormData) {
    'use server';
    const enabled = formData.get('enabled') === 'on';
    const amount = Number(formData.get('amount') ?? 300);
    await updateDepositSettingsAction({ enabled, amount });
  }

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold">Anzahlung</h2>
        <p className="text-sm text-slate-500">
          Betrag und Sichtbarkeit für die Anzahlung in der Preisübersicht des Formulars.
        </p>
        <form action={save} className="space-y-3 text-sm">
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={enabled}
              className="h-4 w-4 rounded border-slate-300"
            />
            Anzahlung anzeigen
          </label>
          <div>
            <label className="block text-slate-600">Betrag (€)</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min={0}
              defaultValue={amount}
              className="mt-1 w-40 rounded border px-3 py-2"
            />
          </div>
          <button className={`${primaryButtonClasses} px-5`}>Speichern</button>
        </form>
      </div>
    </AdminShell>
  );
}
