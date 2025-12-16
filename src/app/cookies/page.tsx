import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie',
  description: 'Cookie-Richtlinie Waldwirtschaft Heidekönig'
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-brand">Cookie-Richtlinie</h1>
      <div className="mt-4 space-y-3 text-slate-700">
        <p>HIER TEXT EINTRAGEN</p>
        <p>
          Beschreiben Sie hier verwendete Cookies, Speicherdauer und Zwecke. Standardmäßig werden
          nur technisch notwendige Cookies gesetzt (Session/Credentials).
        </p>
      </div>
    </main>
  );
}
