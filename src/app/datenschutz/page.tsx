import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalContent } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung Waldwirtschaft Heidekönig'
};

export const dynamic = 'force-dynamic';

export default async function DatenschutzPage() {
  const content = await getLegalContent('datenschutz');

  return (
    <LegalPage
      title="Datenschutz"
      intro="Informationen zur Verarbeitung personenbezogener Daten für Gäste und Mitarbeitende."
      content={content}
    />
  );
}
