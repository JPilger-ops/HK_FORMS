import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getReWebAppSettings } from '@/lib/settings';
import { updateReWebAppSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export const dynamic = 'force-dynamic';

export default async function ReWebAppSettingsPage() {
  await assertPermission('manage:settings');
  const settings = await getReWebAppSettings();

  async function save(formData: FormData) {
    'use server';
    const enabled = formData.get('enabled') === 'on';
    const baseUrl = (formData.get('baseUrl') as string) ?? '';
    const apiKey = (formData.get('apiKey') as string) ?? '';
    const organizationId = (formData.get('organizationId') as string) ?? '';
    await updateReWebAppSettingsAction({ enabled, baseUrl, apiKey, organizationId });
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">RE-WebAPP Verbindung</h2>
          <p className="text-sm text-slate-500">
            API-URL und Zugriffsdaten für die Anbindung zwischen HK-Forms und RE-WebAPP.
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
            Verbindung aktivieren
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700">API Basis-URL</label>
            <input
              name="baseUrl"
              defaultValue={settings.baseUrl ?? ''}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="https://re-webapp.example.com/api"
            />
            <p className="mt-1 text-xs text-slate-500">Ohne abschließenden Slash, wird automatisch bereinigt.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Organisation / Mandant</label>
            <input
              name="organizationId"
              defaultValue={settings.organizationId ?? ''}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="Optional, z. B. Mandanten-ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">API-Schlüssel</label>
            <input
              type="password"
              name="apiKey"
              placeholder="Nur ausfüllen, wenn ändern"
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Bestehender Schlüssel bleibt erhalten, wenn das Feld leer ist (oder aus RE_WEBAPP_API_KEY).
            </p>
          </div>

          <button type="submit" className={`${primaryButtonClasses} px-6`}>
            Verbindung speichern
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
