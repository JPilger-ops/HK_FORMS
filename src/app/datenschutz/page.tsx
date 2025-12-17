import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung Waldwirtschaft Heidekönig'
};

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-brand">Datenschutz</h1>
      <div className="mt-4 space-y-3 text-slate-700">
        <p>HIER TEXT EINTRAGEN</p>
        <p>
          Bitte den finalen Rechtstext von der Rechtsabteilung ergänzen. Die Seite dient als
          Platzhalter für Informationspflichten nach DSGVO.
        </p>
      </div>
    </main>
  );
}
