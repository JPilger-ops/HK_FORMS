import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell';
import { RequestDetailActions } from '@/components/admin/request-detail-actions';
import { Buffer } from 'node:buffer';
import { getBaseUrl } from '@/lib/auth';
import { assertPermission } from '@/lib/rbac';
import { calculatePricing, parseExtrasSnapshot } from '@/lib/pricing';
import { getPricePerGuestSetting } from '@/lib/settings';
import { mapExtraToInput } from '@/server/extras';

function parseSelectedExtraIds(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    return [];
  }
  return [];
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  await assertPermission('view:requests');
  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id },
    include: { signatures: true, emails: true, auditLogs: { orderBy: { createdAt: 'desc' } } }
  });
  if (!reservation) {
    notFound();
  }
  const hostSignature = reservation.signatures.find((s) => s.type === 'HOST');
  const base = getBaseUrl();
  const legacy = (reservation.legacyData ?? {}) as Record<string, any>;
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const formatMoney = (value?: any) =>
    value || value === 0 ? euro.format(Number(value ?? 0)) : '-';
  const formatPortions = (value?: number | null) =>
    typeof value === 'number' ? `${value} Portionen` : 'Keine Angabe';
  const extrasSnapshot = parseExtrasSnapshot(reservation.extrasSnapshot);
  const selectedFromLegacy = parseSelectedExtraIds(reservation.extrasSelection);
  const selectedExtras = extrasSnapshot.length
    ? extrasSnapshot.map((extra) => extra.id)
    : selectedFromLegacy;
  const extrasFromDb =
    selectedExtras.length && extrasSnapshot.length === 0
      ? await prisma.extraOption.findMany({ where: { id: { in: selectedExtras } } })
      : [];
  const extrasForPricing =
    extrasSnapshot.length > 0 ? extrasSnapshot : extrasFromDb.map(mapExtraToInput);
  const pricePerGuestFromReservation =
    reservation.priceEstimate && reservation.numberOfGuests > 0
      ? Number(reservation.priceEstimate) / reservation.numberOfGuests
      : null;
  const pricePerGuest =
    (Number.isFinite(pricePerGuestFromReservation) ? pricePerGuestFromReservation : null) ??
    (await getPricePerGuestSetting());
  const pricing = calculatePricing(reservation.numberOfGuests, selectedExtras, extrasForPricing, {
    pricePerGuest
  });
  const basePrice = reservation.priceEstimate ? Number(reservation.priceEstimate) : pricing.base;
  const totalPrice = reservation.totalPrice ? Number(reservation.totalPrice) : pricing.total;
  const extrasTotal = pricing.extrasTotal || Math.max(0, totalPrice - basePrice);
  const privacyText = reservation.privacyAcceptedAt
    ? `Einwilligung am ${reservation.privacyAcceptedAt.toLocaleString('de-DE')}`
    : 'Keine Angabe hinterlegt';
  const hostFullName =
    `${reservation.hostFirstName ?? ''} ${reservation.hostLastName ?? ''}`.trim() ||
    reservation.guestName ||
    (legacy.guestName as string) ||
    '';
  const hostCompany = reservation.hostCompany ?? (legacy.hostCompany as string) ?? '';
  const hostEmail =
    reservation.hostEmail ?? reservation.guestEmail ?? (legacy.guestEmail as string) ?? '-';
  const hostPhone =
    reservation.hostPhone ?? reservation.guestPhone ?? (legacy.guestPhone as string) ?? '-';
  const hostAddressParts = [
    (reservation.hostStreet ?? '').trim(),
    [reservation.hostPostalCode ?? '', reservation.hostCity ?? ''].filter(Boolean).join(' ').trim()
  ].filter(Boolean);
  const hostAddress =
    hostAddressParts.length > 0
      ? hostAddressParts.join(', ')
      : (reservation.guestAddress ?? (legacy.guestAddress as string) ?? '-');
  const dietaryNotes = [
    typeof reservation.vegetarianGuests === 'number'
      ? `${reservation.vegetarianGuests}× vegetarisch`
      : null,
    typeof reservation.veganGuests === 'number' ? `${reservation.veganGuests}× vegan` : null
  ]
    .filter(Boolean)
    .join(' | ');
  const combinedNotes = [reservation.extras?.trim() ? reservation.extras.trim() : null, dietaryNotes || null]
    .filter(Boolean)
    .join(' | ');

  return (
    <AdminShell>
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Details</h2>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/reservations/${reservation.id}/pdf`}
              className="rounded border border-brand px-3 py-2 text-sm text-brand"
            >
              PDF herunterladen
            </a>
            <a
              href={`/api/reservations/${reservation.id}/ics`}
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              ICS herunterladen
            </a>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Gastgeber</dt>
              <dd className="font-medium">{hostFullName}</dd>
            </div>
            {hostCompany && (
              <div>
                <dt className="text-slate-500">Firma</dt>
                <dd>{hostCompany}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">E-Mail</dt>
              <dd>{hostEmail}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Telefon</dt>
              <dd>{hostPhone}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Adresse</dt>
              <dd>{hostAddress}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Anlass</dt>
              <dd>{reservation.eventType}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Veranstaltungsdatum</dt>
              <dd>{new Intl.DateTimeFormat('de-DE').format(reservation.eventDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Zeiten</dt>
              <dd>
                {reservation.eventStartTime} - {reservation.eventEndTime}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Start Essen</dt>
              <dd>{reservation.startMeal ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Personenzahl</dt>
              <dd>{reservation.numberOfGuests}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vegetarisch</dt>
              <dd>{formatPortions(reservation.vegetarianGuests)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vegan</dt>
              <dd>{formatPortions(reservation.veganGuests)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Zahlungsart</dt>
              <dd>{reservation.paymentMethod}</dd>
            </div>
          </dl>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Grundpreis</p>
              <p className="font-medium">{formatMoney(basePrice)}</p>
              <p className="text-xs text-slate-500">
                {formatMoney(pricing.pricePerGuest)} pro Person
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Extras</p>
              <p className="font-medium">{formatMoney(extrasTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Gesamt</p>
              <p className="font-medium">{formatMoney(totalPrice)}</p>
            </div>
          </div>

          <div className="mt-4 rounded border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Extras (Auswahl)</p>
            {pricing.extrasBreakdown.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {pricing.extrasBreakdown.map((extra) => (
                  <li key={extra.id} className="flex justify-between">
                    <span>
                      {extra.label}
                      {extra.pricingType === 'PER_PERSON' ? ` (${extra.units} Pers.)` : ''}
                    </span>
                    <span>{formatMoney(extra.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Keine Extras gewählt</p>
            )}
            {pricing.extrasBreakdown.length === 0 && extrasTotal > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Extras wurden übernommen, Details liegen nur als Summe vor.
              </p>
            )}
            <p className="mt-3 text-sm text-slate-600">
              Bemerkungen / Unverträglichkeiten: {combinedNotes || 'Keine Angaben'}
            </p>
          </div>

          {(reservation.internalResponsible || reservation.internalNotes) && (
            <div className="rounded border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Interne Felder</p>
              {reservation.internalResponsible && (
                <p className="text-sm text-slate-600">
                  Zuständig: {reservation.internalResponsible}
                </p>
              )}
              {reservation.internalNotes && (
                <p className="text-sm text-slate-600">Notizen: {reservation.internalNotes}</p>
              )}
            </div>
          )}

          <div className="mt-4 rounded border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="text-xs uppercase tracking-wide">Datenschutz</p>
            <p className="mt-1">{privacyText}</p>
            <p className="mt-1">
              {reservation.termsAcceptedAt
                ? `Reservierungsbedingungen bestätigt am ${reservation.termsAcceptedAt.toLocaleString('de-DE')}`
                : 'Keine Bestätigung der Reservierungsbedingungen hinterlegt.'}
            </p>
            {reservation.termsSnapshot && (
              <div className="mt-2 rounded border border-amber-200 bg-white/60 p-2 text-xs text-slate-700">
                <p className="font-semibold text-amber-900">Bestätigter Text</p>
                <p className="whitespace-pre-line text-slate-700">{reservation.termsSnapshot}</p>
              </div>
            )}
          </div>

          <div>
            <div>
              <p className="text-sm font-medium">Gast Unterschrift</p>
              {hostSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${Buffer.from(hostSignature.imageData).toString('base64')}`}
                  alt="Host signature"
                  className="mt-2 h-32 w-full rounded border object-contain"
                />
              ) : (
                <p className="text-sm text-slate-500">Nicht vorhanden</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">E-Mail Historie</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {reservation.emails.map((email) => (
                <li key={email.id} className="rounded border p-2">
                  <p className="font-medium">{email.subject}</p>
                  <p className="text-slate-500">{email.to}</p>
                  <p className="text-xs text-slate-400">{email.status}</p>
                </li>
              ))}
              {reservation.emails.length === 0 && <p className="text-slate-500">Keine Einträge</p>}
            </ul>
          </div>
        </div>

        <div>
          <RequestDetailActions
            reservationId={reservation.id}
            currentStatus={reservation.status}
          />

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Audit Log</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {reservation.auditLogs.map((log) => (
                <li key={log.id} className="rounded border p-2">
                  <p>{log.action}</p>
                  <p className="text-xs text-slate-500">{log.createdAt.toLocaleString()}</p>
                </li>
              ))}
              {reservation.auditLogs.length === 0 && (
                <p className="text-slate-500">Keine Einträge</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
