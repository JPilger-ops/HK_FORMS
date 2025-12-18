import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getIcsTemplateSettings } from '@/lib/settings';
import { updateIcsTemplateAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export const dynamic = 'force-dynamic';

export default async function IcsSettingsPage() {
  await assertPermission('manage:settings');
  const template = await getIcsTemplateSettings();

  async function save(formData: FormData) {
    'use server';
    const notes = (formData.get('notes') as string) ?? '';
    await updateIcsTemplateAction({ notes });
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">ICS Einstellungen</h2>
          <p className="text-sm text-slate-500">
            Vorlage für ICS-Notizen, die Gästen und Admins im Kalender-Eintrag angezeigt werden.
          </p>
        </div>
        <form action={save} className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-700">Notizen-Vorlage</label>
            <textarea
              name="notes"
              defaultValue={template.notes}
              rows={10}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Platzhalter: {'{{guestName}}, {{guestEmail}}, {{guestPhone}}, {{guestAddress}}, {{eventDate}}, {{eventStart}}, {{eventEnd}}, {{guests}}, {{startMeal}}, {{paymentMethod}}, {{pricePerGuest}}, {{extrasList}}, {{notes}}, {{reservationId}}'}
            </p>
          </div>
          <button type="submit" className={`${primaryButtonClasses} px-6`}>
            Vorlage speichern
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
