import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getNetworkSettings } from '@/lib/settings';
import { updateNetworkSettingsAction } from '@/server/actions/settings';
import { primaryButtonClasses } from '@/app/admin/(secure)/settings/styles';

export const dynamic = 'force-dynamic';

export default async function NetworkSettingsPage() {
  await assertPermission('manage:settings');
  const settings = await getNetworkSettings();

  async function save(formData: FormData) {
    'use server';
    const adminBaseUrl = (formData.get('adminBaseUrl') as string) ?? '';
    const publicFormUrl = (formData.get('publicFormUrl') as string) ?? '';
    const nextauthUrl = (formData.get('nextauthUrl') as string) ?? '';
    const formBaseUrl = (formData.get('formBaseUrl') as string) ?? '';
    const nextPublicFormUrl = (formData.get('nextPublicFormUrl') as string) ?? '';
    const enforceDomainRouting = formData.get('enforceDomainRouting') === 'on';
    await updateNetworkSettingsAction({
      adminBaseUrl,
      publicFormUrl,
      nextauthUrl,
      formBaseUrl,
      nextPublicFormUrl,
      enforceDomainRouting
    });
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Network</h2>
          <p className="text-sm text-slate-500">
            Basis-URLs und Domain-Routing steuern (Admin-Domain, Formular-Domain, NextAuth).
          </p>
        </div>

        <form
          action={save}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm md:p-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Admin Base URL</label>
            <input
              name="adminBaseUrl"
              defaultValue={settings.adminBaseUrl ?? ''}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="https://admin.example.com"
            />
            <p className="mt-1 text-xs text-slate-500">Ohne abschließenden Slash.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Formular URL</label>
            <input
              name="publicFormUrl"
              defaultValue={settings.publicFormUrl ?? ''}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="https://forms.example.com"
            />
            <p className="mt-1 text-xs text-slate-500">Öffentliche Formular-Domain.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">NextAuth URL</label>
            <input
              name="nextauthUrl"
              defaultValue={settings.nextauthUrl ?? ''}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="https://admin.example.com"
            />
            <p className="mt-1 text-xs text-slate-500">Wird für Auth-Callback und Links verwendet.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Form Base URL (optional)</label>
              <input
                name="formBaseUrl"
                defaultValue={settings.formBaseUrl ?? ''}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                placeholder="https://forms.example.com"
              />
              <p className="mt-1 text-xs text-slate-500">Alternative Formular-Basis (Fallback).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                NEXT_PUBLIC_FORM_URL (optional)
              </label>
              <input
                name="nextPublicFormUrl"
                defaultValue={settings.nextPublicFormUrl ?? ''}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                placeholder="https://forms.example.com"
              />
              <p className="mt-1 text-xs text-slate-500">Client-seitiger Fallback für Formular-Links.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              name="enforceDomainRouting"
              defaultChecked={settings.enforceDomainRouting}
              className="h-4 w-4 rounded border-slate-300"
            />
            Domain-Routing erzwingen (Produktivmodus)
          </label>

          <div className="pt-2">
            <button type="submit" className={`${primaryButtonClasses} px-6`}>
              Einstellungen speichern
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
