import { ReservationForm } from '@/components/forms/reservation-form';
import { inviteTokenRequired } from '@/lib/config';

export default function RequestPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : undefined;
  const requireToken = inviteTokenRequired();
  if (requireToken && !token) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold text-brand">Einladung erforderlich</h1>
          <p className="mt-2 text-sm text-slate-500">
            Dieses Formular kann nur über einen gültigen Einladungslink ausgefüllt werden. Bitte
            prüfen Sie Ihre E-Mail oder wenden Sie sich an das Team der Waldwirtschaft Heidekönig.
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-brand">Reservierungsformular</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bitte füllen Sie alle Pflichtfelder aus. Nach dem Absenden erhalten unsere Mitarbeiter
          automatisch Ihre Angaben.
        </p>
        <div className="mt-6">
          <ReservationForm inviteToken={token} />
        </div>
      </div>
    </main>
  );
}
