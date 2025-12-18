import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertPermission } from '@/lib/rbac';
import { reservationToIcs } from '@/lib/ics';
import { parseExtrasSnapshot } from '@/lib/pricing';
import { getPricePerGuestSetting } from '@/lib/settings';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await assertPermission('view:requests');
  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id }
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const extras = parseExtrasSnapshot(reservation.extrasSnapshot);
  const pricePerGuest =
    reservation.priceEstimate && reservation.numberOfGuests > 0
      ? Number(reservation.priceEstimate) / reservation.numberOfGuests
      : await getPricePerGuestSetting();

  const ics = reservationToIcs({
    reservation,
    extras,
    pricePerGuest
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="heidekoenig_reservierung_${reservation.id}.ics"`
    }
  });
}
