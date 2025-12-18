import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalContent } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum Waldwirtschaft Heidekönig'
};

export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
  const content = await getLegalContent('impressum');

  return (
    <LegalPage
      title="Impressum"
      intro="Gesetzliche Pflichtangaben für die Waldwirtschaft Heidekönig."
      content={content}
    />
  );
}
