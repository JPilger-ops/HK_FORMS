import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-8 p-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-slate-500">Waldwirtschaft Heidekönig</p>
        <h1 className="mt-2 text-4xl font-semibold text-brand">Reservierungsportal</h1>
        <p className="mt-4 text-lg text-slate-600">
          Erfassen Sie neue Reservierungsanfragen oder verwalten Sie bestehende Anfragen der Gäste.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/request"
          className="rounded-full bg-brand px-8 py-3 text-white shadow transition hover:bg-brand-light"
        >
          Reservierungsformular öffnen
        </Link>
        <Link
          href="/admin/login"
          className="rounded-full border border-slate-300 px-8 py-3 text-brand shadow-sm transition hover:border-brand"
        >
          Admin Login
        </Link>
      </div>
    </main>
  );
}
