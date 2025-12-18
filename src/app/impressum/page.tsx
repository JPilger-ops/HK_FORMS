import type { Metadata } from 'next';
import { getDataOwner, getImprintText } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum Waldwirtschaft Heidekönig'
};

export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
  const [dataOwner, imprintText] = await Promise.all([getDataOwner(), getImprintText()]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-brand">Impressum</h1>
      <div className="mt-6 space-y-8 text-slate-700">
        <section className="space-y-2 rounded border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-brand">Anbieter & Verantwortlich</h2>
          <p className="whitespace-pre-line leading-relaxed">{dataOwner}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand">Weitere Angaben</h2>
          <div className="whitespace-pre-line leading-relaxed">{imprintText}</div>
        </section>
      </div>
    </main>
  );
}
