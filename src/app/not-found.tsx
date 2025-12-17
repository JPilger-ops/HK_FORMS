export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center">
      <div className="rounded bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-800">Hier ist leider nichts.</h1>
        <p className="mt-2 text-sm text-slate-600">Die angeforderte Seite wurde nicht gefunden.</p>
      </div>
    </main>
  );
}
