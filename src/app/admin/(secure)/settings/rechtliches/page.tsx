import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { LegalPageKey, getLegalContent } from '@/lib/settings';
import { updateLegalContentAction } from '@/server/actions/settings';
import { primaryButtonClasses, subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';

const tabs: Array<{ key: LegalPageKey; label: string; helper: string }> = [
  {
    key: 'impressum',
    label: 'Impressum',
    helper: 'Betreiberangaben, Kontakt, Haftungs- und Urheberhinweise.'
  },
  {
    key: 'datenschutz',
    label: 'Datenschutz',
    helper: 'Zwecke, Rechtsgrundlagen, Empfänger, Aufbewahrung, Rechte.'
  },
  {
    key: 'cookies',
    label: 'Cookie-Richtlinie',
    helper: 'Eingesetzte Cookies, Speicherdauer und Widerrufsmöglichkeiten.'
  }
];

export const dynamic = 'force-dynamic';

const tabHints: Record<LegalPageKey, string[]> = {
  impressum: [
    'Betreiber/Anschrift, E-Mail, Telefon, USt-ID, verantwortliche Person nach §18 MStV.',
    'Haftung für Inhalte/Links und Hinweis auf EU-Streitbeilegungsplattform.',
    'Optional: Bildnachweise oder besondere Aufsichtsbehörden.'
  ],
  datenschutz: [
    'Verantwortlicher und Kontaktdaten, ggf. Datenschutzbeauftragter.',
    'Zwecke, Rechtsgrundlagen, Datenkategorien, Empfänger, Aufbewahrung.',
    'Rechte der Betroffenen (Auskunft, Löschung, Widerspruch) und Beschwerderecht.'
  ],
  cookies: [
    'Auflistung aller technisch notwendigen Cookies und deren Laufzeiten.',
    'Hinweis auf nicht gesetzte Tracking-Tools oder ggf. eingesetzte Dienste.',
    'Beschreibung, wie Nutzer Einwilligungen widerrufen bzw. Cookies löschen können.'
  ]
};

export default async function LegalSettingsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  await assertPermission('manage:settings');

  const tabParam =
    typeof searchParams?.tab === 'string' && ['impressum', 'datenschutz', 'cookies'].includes(searchParams.tab)
      ? (searchParams.tab as LegalPageKey)
      : 'impressum';
  const activeTab = tabs.find((tab) => tab.key === tabParam) ?? tabs[0];
  const content = await getLegalContent(activeTab.key);
  const hintItems = tabHints[activeTab.key];

  async function save(formData: FormData) {
    'use server';
    const value = (formData.get('content') as string) ?? '';
    await updateLegalContentAction(activeTab.key, value);
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Rechtstexte</h2>
            <p className="text-sm text-slate-500">
              Inhalte für Impressum, Datenschutz und Cookie-Richtlinie bearbeiten.
            </p>
          </div>
          <Link href={`/${activeTab.key}`} className={subtleButtonClasses}>
            Öffentliche Seite ansehen
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab.key;
            const base = isActive ? primaryButtonClasses : subtleButtonClasses;
            return (
              <Link
                key={tab.key}
                href={`/admin/settings/rechtliches?tab=${tab.key}`}
                className={`${base} px-4 py-2`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <form action={save} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700">Inhalt</label>
              <p className="text-xs text-slate-500">
                Der Text wird exakt so angezeigt wie eingegeben. Absätze durch Leerzeilen trennen.
              </p>
              <textarea
                key={activeTab.key}
                name="content"
                defaultValue={content}
                rows={14}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed shadow-inner focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={`${primaryButtonClasses} px-6`}>
                Speichern
              </button>
              <Link href={`/${activeTab.key}`} className={subtleButtonClasses}>
                Vorschau öffnen
              </Link>
              <Link href="/admin/settings" className={subtleButtonClasses}>
                Zurück zu Einstellungen
              </Link>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{activeTab.label} – Checkliste</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {hintItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Änderungen sind sofort live auf der jeweiligen Seite sichtbar.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
