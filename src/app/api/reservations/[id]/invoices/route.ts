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

const payloadSchema = z.object({
  reference: z.string().min(1).max(200),
  firstItem: z.string().min(1).max(300),
  status: statusSchema,
  sentAt: isoDate,
  paidAt: isoDate,
  overdueSince: isoDate
});

function buildResponse(invoice: any) {
  return {
    id: invoice.id,
    reservationId: invoice.reservationId,
    reference: invoice.invoiceReference,
    firstItem: invoice.firstItemLabel,
    status: invoice.status,
    sentAt: invoice.sentAt,
    paidAt: invoice.paidAt,
    overdueSince: invoice.overdueSince,
    createdAt: invoice.createdAt
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = await validateCrmToken(request);
  if (authError) return authError;

  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const invoices = await prisma.reservationInvoice.findMany({
    where: { reservationId: params.id },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json(invoices.map(buildResponse));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = await validateCrmToken(request);
  if (authError) return authError;

  let parsed: z.infer<typeof payloadSchema>;
  try {
    const json = await request.json();
    parsed = payloadSchema.parse(json);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { reference, firstItem, status, sentAt, paidAt, overdueSince } = parsed;

  const data: any = {
    reservationId: params.id,
    invoiceReference: reference,
    firstItemLabel: firstItem,
    status
  };

  if (status === 'NONE') {
    data.sentAt = null;
    data.paidAt = null;
    data.overdueSince = null;
  }
  if (status === 'SENT') {
    data.sentAt = sentAt ?? new Date();
    data.paidAt = null;
    data.overdueSince = null;
  }
  if (status === 'PAID') {
    data.sentAt = sentAt ?? null;
    data.paidAt = paidAt ?? new Date();
    data.overdueSince = null;
  }
  if (status === 'OVERDUE') {
    data.sentAt = sentAt ?? null;
    data.paidAt = null;
    data.overdueSince = overdueSince ?? new Date();
  }

  const invoice = await prisma.reservationInvoice.upsert({
    where: {
      reservationId_invoiceReference: {
        reservationId: params.id,
        invoiceReference: reference
      }
    },
    update: data,
    create: data
  });

  return NextResponse.json(buildResponse(invoice));
}
