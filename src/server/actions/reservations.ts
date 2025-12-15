'use server';

import { reservationSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { reservationToPdf } from '@/lib/pdf';
import { sendReservationMail } from '@/lib/email';
import { consumeInviteToken } from '@/lib/tokens';
import { ReservationStatus, SignatureType } from '@prisma/client';
import { assertPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

function parseSignature(dataUrl: string) {
  const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
  return Buffer.from(base64, 'base64');
}

function normalizeNumber(value: number | undefined | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

export async function createReservationAction(input: unknown, opts?: { inviteToken?: string }) {
  const safeParse = reservationSchema.safeParse(input);
  if (!safeParse.success) {
    return { success: false, error: 'VALIDATION_ERROR', details: safeParse.error.flatten() };
  }
  const data = safeParse.data;
  const rateKey = `request:${data.guestEmail}`;
  if (!checkRateLimit(rateKey)) {
    return { success: false, error: 'RATE_LIMITED' };
  }

  if (opts?.inviteToken) {
    const token = await consumeInviteToken(opts.inviteToken);
    if (!token) {
      return { success: false, error: 'TOKEN_INVALID' };
    }
  }

  const reservation = await prisma.reservationRequest.create({
    data: {
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      eventDate: new Date(data.eventDate),
      eventType: data.eventType,
      eventStartTime: data.eventStartTime,
      eventEndTime: data.eventEndTime,
      numberOfGuests: data.numberOfGuests,
      paymentMethod: data.paymentMethod,
      extras: data.extras,
      priceEstimate: normalizeNumber(data.priceEstimate),
      totalPrice: normalizeNumber(data.totalPrice),
      internalResponsible: data.internalResponsible,
      internalNotes: data.internalNotes
    }
  });

  await prisma.signature.create({
    data: {
      reservationId: reservation.id,
      type: SignatureType.HOST,
      imageData: parseSignature(data.signature)
    }
  });

  const reservationWithSignatures = await prisma.reservationRequest.findUnique({
    where: { id: reservation.id },
    include: { signatures: true }
  });

  if (!reservationWithSignatures) {
    return { success: false, error: 'NOT_FOUND' };
  }

  const pdf = await reservationToPdf(reservationWithSignatures);

  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map((x) => x.trim()).filter(Boolean);

  if (adminEmails?.length) {
    await sendReservationMail({
      reservationId: reservation.id,
      to: adminEmails,
      subject: `Neue Reservierungsanfrage ${reservation.guestName}`,
      html: `<p>Neue Anfrage von ${reservation.guestName} (${reservation.guestEmail}).</p>`,
      attachments: [
        {
          filename: `heidekoenig_reservierung_${reservation.id}.pdf`,
          content: pdf
        }
      ]
    });
  }

  if (process.env.SEND_GUEST_CONFIRMATION === 'true') {
    await sendReservationMail({
      reservationId: reservation.id,
      to: reservation.guestEmail,
      subject: 'Ihre Anfrage wurde übermittelt',
      html: '<p>Vielen Dank für Ihre Anfrage. Wir melden uns zeitnah.</p>'
    });
  }

  return { success: true, reservationId: reservation.id };
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: ReservationStatus,
  options?: { userId?: string; notes?: string }
) {
  const session = await assertPermission('edit:requests');
  const allowed = Object.values(ReservationStatus);
  if (!allowed.includes(status)) {
    throw new Error('INVALID_STATUS');
  }
  const updated = await prisma.reservationRequest.update({
    where: { id: reservationId },
    data: { status, internalNotes: options?.notes }
  });
  await writeAuditLog({ reservationId, userId: session.user?.id, action: `STATUS:${status}` });
  return updated;
}

export async function attachStaffSignatureAction(reservationId: string, imageData: string) {
  const session = await assertPermission('edit:requests');
  const buffer = parseSignature(imageData);
  await prisma.signature.upsert({
    where: {
      reservationId_type: {
        reservationId,
        type: SignatureType.STAFF
      }
    },
    create: {
      reservationId,
      type: SignatureType.STAFF,
      imageData: buffer
    },
    update: {
      imageData: buffer
    }
  });
  await writeAuditLog({ reservationId, userId: session.user?.id, action: 'SIGNATURE:STAFF' });
}

export async function sendReservationEmailAction(reservationId: string, recipients: string[]) {
  const session = await assertPermission('send:emails');
  const reservation = await prisma.reservationRequest.findUnique({
    where: { id: reservationId },
    include: { signatures: true }
  });
  if (!reservation) {
    throw new Error('NOT_FOUND');
  }
  const pdf = await reservationToPdf(reservation);
  await sendReservationMail({
    reservationId,
    to: recipients,
    subject: `Reservierung ${reservation.guestName} (${reservation.status})`,
    html: '<p>Im Anhang befindet sich die aktuelle PDF.</p>',
    attachments: [
      {
        filename: `heidekoenig_reservierung_${reservation.id}.pdf`,
        content: pdf
      }
    ]
  });
  await writeAuditLog({ reservationId, userId: session.user?.id, action: 'EMAIL:SENT' });
  return true;
}
