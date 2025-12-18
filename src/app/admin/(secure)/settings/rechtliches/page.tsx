import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { getCookieText, getDataOwner, getImprintText, getPrivacyText } from '@/lib/settings';
import { updateDataOwnerAction, updateLegalTextAction } from '@/server/actions/settings';
import { primaryButtonClasses, secondaryButtonClasses } from '@/components/admin/settings/button-styles';

type TabKey = 'privacy' | 'cookies' | 'imprint' | 'owner';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'privacy', label: 'Datenschutz' },
  { key: 'cookies', label: 'Cookies' },
  { key: 'imprint', label: 'Impressum' },
  { key: 'owner', label: 'Dateninhaber' }
];

export const dynamic = 'force-dynamic';

export default async function LegalSettingsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  await assertPermission('manage:settings');

  const [dataOwner, privacyText, cookieText, imprintText] = await Promise.all([
    getDataOwner(),
    getPrivacyText(),
    getCookieText(),
    getImprintText()
  ]);

  const activeTabParam = typeof searchParams?.tab === 'string' ? searchParams.tab : undefined;
  const activeTab: TabKey = tabs.some((tab) => tab.key === activeTabParam)
    ? (activeTabParam as TabKey)
    : 'privacy';

  async function saveOwner(formData: FormData) {
    'use server';
    const value = (formData.get('dataOwner') as string) ?? '';
    await updateDataOwnerAction(value);
  }

  async function savePrivacy(formData: FormData) {
    'use server';
    const value = (formData.get('privacyText') as string) ?? '';
    await updateLegalTextAction('privacy', value);
  }

  async function saveCookies(formData: FormData) {
    'use server';
    const value = (formData.get('cookieText') as string) ?? '';
    await updateLegalTextAction('cookies', value);
  }

  async function saveImprint(formData: FormData) {
    'use server';
    const value = (formData.get('imprintText') as string) ?? '';
    await updateLegalTextAction('imprint', value);
  }

  const tabLinkClasses = (tab: TabKey) =>
    `${tab === activeTab ? primaryButtonClasses : secondaryButtonClasses} text-sm`;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Rechtliches & DSGVO</h2>
          <p className="text-sm text-slate-500">
            Texte für Impressum, Datenschutz und Cookies sowie die Angaben zum Dateninhaber pflegen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/settings/rechtliches?tab=${tab.key}`}
              className={tabLinkClasses(tab.key)}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          {activeTab === 'owner' && (
            <form action={saveOwner} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-700">Dateninhaber / Verantwortlicher</label>
                <textarea
                  name="dataOwner"
                  defaultValue={dataOwner}
                  rows={6}
                  className="mt-1 w-full rounded border px-3 py-2 leading-relaxed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Diese Angaben werden automatisch auf Impressum-, Datenschutz- und Cookie-Seite
                  angezeigt.
                </p>
              </div>
              <button className={primaryButtonClasses}>Speichern</button>
            </form>
          )}

          {activeTab === 'privacy' && (
            <form action={savePrivacy} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-700">Datenschutzerklärung</label>
                <textarea
                  name="privacyText"
                  defaultValue={privacyText}
                  rows={14}
                  className="mt-1 w-full rounded border px-3 py-2 leading-relaxed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Wird auf der Seite /datenschutz ausgegeben. Zeilenumbrüche werden übernommen.
                </p>
              </div>
              <button className={primaryButtonClasses}>Speichern</button>
            </form>
          )}

          {activeTab === 'cookies' && (
            <form action={saveCookies} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-700">Cookie-Richtlinie</label>
                <textarea
                  name="cookieText"
                  defaultValue={cookieText}
                  rows={12}
                  className="mt-1 w-full rounded border px-3 py-2 leading-relaxed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Wird auf der Seite /cookies ausgegeben. Beschreibe hier Zweck, Name und Laufzeit
                  genutzter Cookies.
                </p>
              </div>
              <button className={primaryButtonClasses}>Speichern</button>
            </form>
          )}

          {activeTab === 'imprint' && (
            <form action={saveImprint} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-700">Impressum / Anbieterkennzeichnung</label>
                <textarea
                  name="imprintText"
                  defaultValue={imprintText}
                  rows={14}
                  className="mt-1 w-full rounded border px-3 py-2 leading-relaxed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Wird auf der Seite /impressum unterhalb der Verantwortlichkeitsangaben angezeigt.
                </p>
              </div>
              <button className={primaryButtonClasses}>Speichern</button>
            </form>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
