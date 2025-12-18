import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getEmailTemplateSettings, getSmtpSettings } from '@/lib/settings';
import { updateEmailTemplateAction, updateSmtpSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses, subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
  await assertPermission('manage:settings');
  const smtp = await getSmtpSettings();
  const template = await getEmailTemplateSettings();
  const secureDefault = smtp.secure ?? (smtp.port === 465);

  async function saveSmtp(formData: FormData) {
    'use server';
    const host = (formData.get('host') as string) ?? '';
    const port = Number(formData.get('port') ?? 587);
    const user = (formData.get('user') as string) ?? '';
    const pass = (formData.get('pass') as string) ?? '';
    const from = (formData.get('from') as string) ?? '';
    const secure = formData.get('secure') === 'on';
    await updateSmtpSettingsAction({ host, port, user, pass, from, secure });
  }

  async function saveTemplate(formData: FormData) {
    'use server';
    const subject = (formData.get('subject') as string) ?? '';
    const body = (formData.get('body') as string) ?? '';
    await updateEmailTemplateAction({ subject, body });
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">E-Mail & SMTP</h2>
            <p className="text-sm text-slate-500">
              Absender, Serverdaten und Vorlage für die Gastbestätigung anpassen.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {'Platzhalter: {{guestName}}, {{eventDate}}, {{eventStart}}, {{eventEnd}}, {{reservationId}}'}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <form
            action={saveSmtp}
            className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
          >
            <div>
              <h3 className="text-lg font-semibold text-brand">SMTP-Zugang</h3>
              <p className="text-sm text-slate-600">
                Diese Daten werden für alle ausgehenden E-Mails genutzt (Anfragen, Einladungen).
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Host</label>
                <input
                  name="host"
                  defaultValue={smtp.host ?? ''}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="smtp.beispiel.de"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Port</label>
                <input
                  type="number"
                  name="port"
                  defaultValue={smtp.port ?? 587}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Benutzer</label>
                <input
                  name="user"
                  defaultValue={smtp.user ?? ''}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Passwort</label>
                <input
                  type="password"
                  name="pass"
                  placeholder="Nur ausfüllen, wenn ändern"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leer lassen, um das gespeicherte Passwort beizubehalten.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Absender (From)</label>
              <input
                name="from"
                defaultValue={smtp.from ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Waldwirtschaft &lt;reservierung@heidekoenig.de&gt;"
              />
              <p className="mt-1 text-xs text-slate-500">
                Wenn leer, wird der Benutzername als Absender genutzt.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="secure"
                defaultChecked={secureDefault}
                className="h-4 w-4 rounded border-slate-300"
              />
              Verbindung via SSL (Port 465)
            </label>
            <button type="submit" className={`${primaryButtonClasses} px-6`}>
              SMTP speichern
            </button>
          </form>

          <form
            action={saveTemplate}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <h3 className="text-lg font-semibold text-brand">Vorlage Gastbestätigung</h3>
              <p className="text-sm text-slate-600">
                Wird an Gäste gesendet, wenn SEND_GUEST_CONFIRMATION aktiv ist.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Betreff</label>
              <input
                name="subject"
                defaultValue={template.subject}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-Mail-Text</label>
              <textarea
                name="body"
                defaultValue={template.body}
                rows={10}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed"
              />
              <p className="mt-1 text-xs text-slate-500">
                {'Absätze mit Leerzeile trennen. Platzhalter mit doppelten geschweiften Klammern einfügen, z. B. {{guestName}}.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={`${primaryButtonClasses} px-6`}>
                Vorlage speichern
              </button>
              <Link href="/admin/requests" className={subtleButtonClasses}>
                Zur Anfragenliste
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
