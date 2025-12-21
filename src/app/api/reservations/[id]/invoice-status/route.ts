import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateCrmToken } from '@/lib/crm-auth';

const statusSchema = z.enum(['NONE', 'SENT', 'PAID', 'OVERDUE']);

const isoDate = z
  .string()
  .datetime()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined));

const requestSchema = z.object({
  status: statusSchema,
  reference: z
    .string()
    .max(200)
    .optional()
    .transform((value) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }),
  sentAt: isoDate,
  paidAt: isoDate,
  overdueSince: isoDate
});

function buildSnapshot(reservation: any) {
  return {
    reservationId: reservation.id,
    status: reservation.invoiceStatus,
    reference: reservation.invoiceReference,
    sentAt: reservation.invoiceSentAt,
    paidAt: reservation.invoicePaidAt,
    overdueSince: reservation.invoiceOverdueSince
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = validateCrmToken(request);
  if (authError) return authError;

  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      invoiceStatus: true,
      invoiceReference: true,
      invoiceSentAt: true,
      invoicePaidAt: true,
      invoiceOverdueSince: true
    }
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(buildSnapshot(reservation));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = validateCrmToken(request);
  if (authError) return authError;

  let parsed;
  try {
    const json = await request.json();
    parsed = requestSchema.parse(json);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id }
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { status, reference, sentAt, paidAt, overdueSince } = parsed;
  const updateData: any = {
    invoiceStatus: status
  };

  if (reference !== undefined) {
    updateData.invoiceReference = reference;
  }

  if (status === 'NONE') {
    updateData.invoiceSentAt = null;
    updateData.invoicePaidAt = null;
    updateData.invoiceOverdueSince = null;
  }

  if (status === 'SENT') {
    updateData.invoiceSentAt = sentAt ?? reservation.invoiceSentAt ?? new Date();
    updateData.invoicePaidAt = null;
    updateData.invoiceOverdueSince = null;
  }

  if (status === 'PAID') {
    updateData.invoiceSentAt = sentAt ?? reservation.invoiceSentAt ?? null;
    updateData.invoicePaidAt = paidAt ?? new Date();
    updateData.invoiceOverdueSince = null;
  }

  if (status === 'OVERDUE') {
    updateData.invoiceSentAt = sentAt ?? reservation.invoiceSentAt ?? null;
    updateData.invoicePaidAt = null;
    updateData.invoiceOverdueSince = overdueSince ?? new Date();
  }

  const updated = await prisma.reservationRequest.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      invoiceStatus: true,
      invoiceReference: true,
      invoiceSentAt: true,
      invoicePaidAt: true,
      invoiceOverdueSince: true
    }
  });

  return NextResponse.json(buildSnapshot(updated));
}
