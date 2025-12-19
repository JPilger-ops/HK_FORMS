import { ReservationForm } from '@/components/forms/reservation-form';
import { validateInviteToken } from '@/lib/tokens';
import { listActiveExtraOptions } from '@/server/extras';
import { InvalidRequestNotice } from './invalid/invalid-request';
import { FooterLinks } from '@/components/footer-links';
import { getPricingSettings, getReservationTerms } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function RequestPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : undefined;
  const validation = token ? await validateInviteToken(token) : { valid: false as const };
  const tokenValid = validation.valid;
  const tokenMissing = !token;

  if (tokenMissing || !tokenValid) {
    return <InvalidRequestNotice />;
  }

  const extrasOptions = await listActiveExtraOptions();
  const termsText = await getReservationTerms();
  const pricingSettings = await getPricingSettings();

  return (
    <>
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold text-brand">Reservierungsformular</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bitte füllen Sie alle Pflichtfelder aus. Nach dem Absenden erhalten unsere Mitarbeiter
            automatisch Ihre Angaben.
          </p>
          <div className="mt-6">
            <ReservationForm
              inviteToken={token}
              extrasOptions={extrasOptions}
              enforcedEndTime="22:30"
              termsText={termsText}
              depositSettings={{
                enabled: pricingSettings.enabled,
                amount: pricingSettings.amount
              }}
              pricePerGuest={pricingSettings.pricePerGuest}
            />
          </div>
        </div>
      </main>
      <FooterLinks />
    </>
  );
}
