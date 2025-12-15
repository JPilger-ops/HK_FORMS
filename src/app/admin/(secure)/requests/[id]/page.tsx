import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell';
import { RequestDetailActions } from '@/components/admin/request-detail-actions';
import { Buffer } from 'node:buffer';
import { getBaseUrl } from '@/lib/auth';
import { assertPermission } from '@/lib/rbac';

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
  const staffSignature = reservation.signatures.find((s) => s.type === 'STAFF');
  const base = getBaseUrl();

  const formatMoney = (value?: any) => (value ? `${value.toString()} €` : '-');

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
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Gastgeber</dt>
              <dd className="font-medium">{reservation.guestName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-Mail</dt>
              <dd>{reservation.guestEmail}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Anlass</dt>
              <dd>{reservation.eventType}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Datum</dt>
              <dd>{new Intl.DateTimeFormat('de-DE').format(reservation.eventDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Zeiten</dt>
              <dd>
                {reservation.eventStartTime} - {reservation.eventEndTime}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Personenzahl</dt>
              <dd>{reservation.numberOfGuests}</dd>
            </div>
          </dl>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Preis</p>
              <p className="font-medium">{formatMoney(reservation.priceEstimate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="font-medium">{formatMoney(reservation.totalPrice)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Zuständig</p>
              <p>{reservation.internalResponsible ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Bemerkungen</p>
              <p>{reservation.internalNotes ?? '-'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <div>
              <p className="text-sm font-medium">Mitarbeiter Unterschrift</p>
              {staffSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${Buffer.from(staffSignature.imageData).toString('base64')}`}
                  alt="Staff signature"
                  className="mt-2 h-32 w-full rounded border object-contain"
                />
              ) : (
                <p className="text-sm text-slate-500">Noch nicht erfasst</p>
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
            appUrl={base}
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
