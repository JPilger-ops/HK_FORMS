import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getNotificationSettings } from '@/lib/settings';
import { updateNotificationSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  await assertPermission('manage:settings');
  const settings = await getNotificationSettings();

  async function save(formData: FormData) {
    'use server';
    const enabled = formData.get('enabled') === 'on';
    const recipients = (formData.get('recipients') as string) ?? '';
    const subject = (formData.get('subject') as string) ?? '';
    const body = (formData.get('body') as string) ?? '';
    await updateNotificationSettingsAction({ enabled, recipients, subject, body });
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Notification Einstellungen</h2>
          <p className="text-sm text-slate-500">
            Empfänger und Texte für interne Benachrichtigungen bei neuen Reservierungsanfragen.
          </p>
        </div>

        <form
          action={save}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm md:p-6"
        >
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="h-4 w-4 rounded border-slate-300"
            />
            E-Mail-Benachrichtigungen aktivieren
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700">Empfänger</label>
            <textarea
              name="recipients"
              defaultValue={settings.recipients.join(', ')}
              rows={2}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="orga@beispiel.de, team@beispiel.de"
            />
            <p className="mt-1 text-xs text-slate-500">
              Komma, Semikolon oder Zeilenumbruch trennen mehrere Empfänger.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Betreff</label>
            <input
              name="subject"
              defaultValue={settings.subject}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">E-Mail-Text</label>
            <textarea
              name="body"
              defaultValue={settings.body}
              rows={10}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 leading-relaxed"
            />
            <p className="mt-1 text-xs text-slate-500">
              {'Absätze mit Leerzeile trennen. Extras werden als HTML-Liste über "{{extrasList}}" eingefügt.'}
            </p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-800">Platzhalter</p>
            <p className="mt-1">
              {'{{guestName}}, {{guestEmail}}, {{guestPhone}}, {{guestAddress}}, {{eventDate}}, {{eventStart}}, {{eventEnd}}, {{guests}}, {{startMeal}}, {{paymentMethod}}, {{pricePerGuest}}, {{totalPrice}}, {{extrasList}}, {{notes}}, {{reservationId}}'}
            </p>
          </div>

          <button type="submit" className={`${primaryButtonClasses} px-6`}>
            Benachrichtigungen speichern
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
