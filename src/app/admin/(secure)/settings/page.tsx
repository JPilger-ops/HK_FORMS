import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { primaryButtonClasses, subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';

const cards = [
  {
    href: '/admin/settings/formular',
    title: 'Formular & Extras',
    description: 'Felder und Zusatzleistungen für das öffentliche Reservierungsformular pflegen.'
  },
  {
    href: '/admin/settings/bedingungen',
    title: 'Reservierungsbedingungen',
    description: 'AGB/Reservierungsbedingungen, die Gäste bestätigen müssen.'
  },
  {
    href: '/admin/settings/deposit',
    title: 'Preis & Preisübersicht',
    description: 'Grundpreis p. P. und optionale Anzahlung für die Preisübersicht verwalten.'
  },
  {
    href: '/admin/settings/email',
    title: 'E-Mail & SMTP',
    description: 'Absenderdaten und Bestätigungs-Vorlage für den E-Mail-Versand pflegen.'
  },
  {
    href: '/admin/settings/notification',
    title: 'Notification Einstellungen',
    description: 'E-Mail-Benachrichtigungen für neue Reservierungen konfigurieren.'
  },
  {
    href: '/admin/settings/network',
    title: 'Network',
    description: 'Domains, NextAuth-URL und Domain-Routing verwalten.'
  },
  {
    href: '/admin/settings/re-webapp',
    title: 'RE-WebAPP Verbindung',
    description: 'API-URL und Schlüssel für die RE-WebAPP-Anbindung verwalten.'
  },
  {
    href: '/admin/settings/ics',
    title: 'ICS Einstellungen',
    description: 'Notizen-Vorlage für Kalender-Einträge anpassen.'
  },
  {
    href: '/admin/settings/rechtliches',
    title: 'Rechtstexte',
    description: 'Impressum, Datenschutzerklärung und Cookie-Richtlinie bearbeiten.'
  }
];

export default async function SettingsPage() {
  await assertPermission('manage:settings');

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Einstellungen</h2>
          <p className="text-sm text-slate-500">
            Konfiguration für Formular, Zahlungsinfo und rechtliche Pflichtseiten.
          </p>
        </div>
        <Link href="/request" className={subtleButtonClasses}>
          Formular ansehen
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.href}
            className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-brand">{card.title}</h3>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
            <div className="mt-4">
              <Link href={card.href} className={primaryButtonClasses}>
                Öffnen
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
