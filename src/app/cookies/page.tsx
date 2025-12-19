import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalContent } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie',
  description: 'Cookie-Richtlinie Waldwirtschaft Heidekönig'
};

export const dynamic = 'force-dynamic';

export default async function CookiesPage() {
  const content = await getLegalContent('cookies');

  return (
    <LegalPage
      title="Cookie-Richtlinie"
      intro="Übersicht der eingesetzten Cookies und Hinweise zum Umgang mit Ihrer Auswahl."
      content={content}
    />
  );
}
