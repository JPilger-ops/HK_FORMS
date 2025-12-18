import type { Metadata } from 'next';
import { getCookieText, getDataOwner } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie',
  description: 'Cookie-Richtlinie Waldwirtschaft Heidekönig'
};

export const dynamic = 'force-dynamic';

export default async function CookiesPage() {
  const [dataOwner, cookieText] = await Promise.all([getDataOwner(), getCookieText()]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-brand">Cookie-Richtlinie</h1>
      <div className="mt-6 space-y-8 text-slate-700">
        <section className="space-y-2 rounded border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-brand">Verantwortlicher / Dateninhaber</h2>
          <p className="whitespace-pre-line leading-relaxed">{dataOwner}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand">Cookie-Einsatz</h2>
          <div className="whitespace-pre-line leading-relaxed">{cookieText}</div>
        </section>
      </div>
    </main>
  );
}
