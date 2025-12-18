import { prisma } from '@/lib/prisma';
import { AdminShell } from '@/components/admin/shell';
import { assertPermission, can } from '@/lib/rbac';
import { Prisma, Role } from '@prisma/client';
import { subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';
import { RequestsTable } from '@/components/admin/requests-table';

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

  const requestData = requests.map((req) => ({
    id: req.id,
    guestName: req.guestName,
    eventDate: req.eventDate.toISOString(),
    numberOfGuests: req.numberOfGuests,
    status: req.status
  }));

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
      <RequestsTable requests={requestData} canEdit={canEdit} />
    </AdminShell>
  );
}
