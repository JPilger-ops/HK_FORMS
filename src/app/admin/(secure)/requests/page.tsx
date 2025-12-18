import { prisma } from '@/lib/prisma';
import { AdminShell } from '@/components/admin/shell';
import { StatusBadge } from '@/components/admin/status-badge';
import Link from 'next/link';
import { assertPermission, can } from '@/lib/rbac';
import { Prisma, Role } from '@prisma/client';
import { deleteReservationRequestsAction } from '@/server/actions/reservations';
import { dangerButtonClasses, subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';

export default async function RequestsPage({
  searchParams
}: {
  searchParams?: Record<string, string>;
}) {
  const session = await assertPermission('view:requests');
  const canEdit = can('edit:requests', session.user?.role as Role);
  const search = searchParams?.q;
  const where = search
    ? {
        OR: [
          { guestName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { guestEmail: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      }
    : {};
  const requests = await prisma.reservationRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  async function bulkDelete(formData: FormData) {
    'use server';
    const ids = formData.getAll('ids').map((id) => String(id)).filter(Boolean);
    if (!ids.length) return;
    await deleteReservationRequestsAction(ids);
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <form className="flex w-full max-w-sm gap-2">
          <input
            type="search"
            name="q"
            placeholder="Suche nach Name oder E-Mail"
            defaultValue={search}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button className={`${subtleButtonClasses} px-4`}>Suche</button>
        </form>
      </div>

      <form action={bulkDelete}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                {canEdit && <th className="p-2">Auswahl</th>}
                <th className="p-2">Name</th>
                <th className="p-2">Datum</th>
                <th className="p-2">Personen</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t">
                  {canEdit && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        name="ids"
                        value={req.id}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                  )}
                  <td className="p-2">{req.guestName}</td>
                  <td className="p-2">
                    {new Intl.DateTimeFormat('de-DE').format(req.eventDate)}
                  </td>
                  <td className="p-2">{req.numberOfGuests}</td>
                  <td className="p-2">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="p-2">
                    <Link href={`/admin/requests/${req.id}`} className="text-brand underline">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Keine Anfragen gefunden.</p>
        )}

        {canEdit && requests.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button type="submit" className={`${dangerButtonClasses} px-4`}>
              Ausgewählte löschen
            </button>
          </div>
        )}
      </form>
    </AdminShell>
  );
}
