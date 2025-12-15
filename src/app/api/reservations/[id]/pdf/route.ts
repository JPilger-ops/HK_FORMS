import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reservationToPdf } from '@/lib/pdf';
import { assertPermission } from '@/lib/rbac';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await assertPermission('view:requests');
  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id },
    include: { signatures: true }
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pdf = await reservationToPdf(reservation);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="heidekoenig_reservierung_${reservation.id}.pdf"`
    }
  });
}
