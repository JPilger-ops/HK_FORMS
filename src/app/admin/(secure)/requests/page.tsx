import { prisma } from '@/lib/prisma';
import { AdminShell } from '@/components/admin/shell';
import { StatusBadge } from '@/components/admin/status-badge';
import Link from 'next/link';
import { assertPermission } from '@/lib/rbac';

export default async function RequestsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  await assertPermission('view:requests');
  const search = searchParams?.q;
  const where = search
    ? {
        OR: [
          { guestName: { contains: search, mode: 'insensitive' } },
          { guestEmail: { contains: search, mode: 'insensitive' } }
        ]
      }
    : {};
  const requests = await prisma.reservationRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

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
          <button className="rounded bg-brand px-3 py-2 text-sm text-white">Suche</button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
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
                <td className="p-2">{req.guestName}</td>
                <td className="p-2">{new Intl.DateTimeFormat('de-DE').format(req.eventDate)}</td>
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
    </AdminShell>
  );
}
