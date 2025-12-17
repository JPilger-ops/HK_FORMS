import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum Waldwirtschaft Heidekönig'
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-brand">Impressum</h1>
      <p className="mt-4 text-slate-700">HIER TEXT EINTRAGEN</p>
    </main>
  );
}
