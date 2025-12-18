import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getPricingSettings } from '@/lib/settings';
import { updatePricingSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export default async function DepositSettingsPage() {
  await assertPermission('manage:settings');
  const { enabled, amount, pricePerGuest } = await getPricingSettings();

  async function save(formData: FormData) {
    'use server';
    const enabled = formData.get('enabled') === 'on';
    const amount = Number(formData.get('amount') ?? 300);
    const pricePerGuest = Number(formData.get('pricePerGuest') ?? 35);
    await updatePricingSettingsAction({ enabled, amount, pricePerGuest });
  }

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold">Preis & Preisübersicht</h2>
        <p className="text-sm text-slate-500">
          Grundpreis pro Person sowie Anzahlung steuern die Preisübersicht im öffentlichen Formular.
        </p>
        <form action={save} className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-600">Grundpreis pro Person (€)</label>
            <input
              type="number"
              name="pricePerGuest"
              step="0.01"
              min={0}
              defaultValue={pricePerGuest}
              className="mt-1 w-40 rounded border px-3 py-2"
              required
            />
          </div>
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
