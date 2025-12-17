import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getReservationTerms } from '@/lib/settings';
import { updateReservationTermsAction } from '@/server/actions/settings';

export default async function BedingungenSettingsPage() {
  await assertPermission('manage:settings');
  const terms = await getReservationTerms();

  async function saveTerms(formData: FormData) {
    'use server';
    const value = (formData.get('terms') as string) ?? '';
    await updateReservationTermsAction(value);
  }

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">Reservierungsbedingungen</h2>
        <p className="text-sm text-slate-500">
          Dieser Text wird im Formular per „Mehr“-Link als vollständige Reservierungsbedingungen/AGB
          angezeigt und muss bestätigt werden.
        </p>
        <form action={saveTerms} className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-600">Text</label>
            <textarea
              name="terms"
              defaultValue={terms}
              rows={8}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button className="rounded bg-brand px-4 py-2 font-semibold text-white">Speichern</button>
        </form>
      </div>
    </AdminShell>
  );
}
