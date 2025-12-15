import { ReservationForm } from '@/components/forms/reservation-form';

export default function RequestPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : undefined;
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-brand">Reservierungsformular</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bitte füllen Sie alle Pflichtfelder aus. Nach dem Absenden erhalten unsere Mitarbeiter automatisch Ihre Angaben.
        </p>
        <div className="mt-6">
          <ReservationForm inviteToken={token} />
        </div>
      </div>
    </main>
  );
}
