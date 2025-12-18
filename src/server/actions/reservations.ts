'use server';

import { reservationSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { reservationToPdf } from '@/lib/pdf';
import { sendReservationMail } from '@/lib/email';
import { consumeInviteTokenForReservation } from '@/lib/tokens';
import { Prisma, ReservationStatus, SignatureType } from '@prisma/client';
import { assertPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import {
  calculatePricing,
  buildExtrasSnapshot,
  ExtraOptionInput,
  parseExtrasSnapshot
} from '@/lib/pricing';
import { getEmailTemplateSettings, getReservationTerms } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

const ENFORCED_END_TIME = '22:30';

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

function formatHostAddress(data: {
  hostStreet?: string;
  hostPostalCode?: string;
  hostCity?: string;
}) {
  const parts = [
    (data.hostStreet ?? '').trim(),
    [data.hostPostalCode ?? '', data.hostCity ?? ''].filter(Boolean).join(' ').trim()
  ].filter(Boolean);
  return parts.join(', ');
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? '');
}

function toHtmlParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.trim().replace(/\n/g, '<br />')}</p>`)
    .join('');
}

async function getExtrasForSelection(ids: string[]): Promise<ExtraOptionInput[]> {
  if (!ids.length) return [];
  const extras = await prisma.extraOption.findMany({
    where: { id: { in: ids }, isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  return extras.map((extra) => ({
    id: extra.id,
    label: extra.label,
    description: extra.description,
    pricingType: extra.pricingType === 'PER_PERSON' ? 'PER_PERSON' : 'FLAT',
    priceCents: extra.priceCents
  }));
}

export async function createReservationAction(input: unknown, opts?: { inviteToken?: string }) {
  const safeParse = reservationSchema.safeParse(input);
  if (!safeParse.success) {
    return { success: false, error: 'VALIDATION_ERROR', details: safeParse.error.flatten() };
  }
  const data = safeParse.data;
  const rateKey = `request:${data.hostEmail}`;
  if (!checkRateLimit(rateKey)) {
    return { success: false, error: 'RATE_LIMITED' };
  }

  const inviteToken = opts?.inviteToken;
  if (!inviteToken) {
    return { success: false, error: 'TOKEN_REQUIRED' };
  }

  const selectedExtras = Array.from(
    new Set((data.selectedExtras ?? []).filter((item) => typeof item === 'string'))
  );
  const extrasOptions = await getExtrasForSelection(selectedExtras);
  const validExtras = selectedExtras.filter((id) => extrasOptions.some((extra) => extra.id === id));
  const extrasSnapshot = buildExtrasSnapshot(validExtras, extrasOptions);
  const pricing = calculatePricing(data.numberOfGuests, validExtras, extrasOptions);
  const hostFullName = `${data.hostFirstName} ${data.hostLastName}`.trim();
  const hostAddress = formatHostAddress(data);
  const termsText = await getReservationTerms();

  type ReservationWithSignatures = Prisma.ReservationRequestGetPayload<{
    include: { signatures: true };
  }>;

  let reservationWithSignatures: ReservationWithSignatures | null;
  try {
    reservationWithSignatures = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservationRequest.create({
        data: {
          hostFirstName: data.hostFirstName,
          hostLastName: data.hostLastName,
          hostStreet: data.hostStreet,
          hostPostalCode: data.hostPostalCode,
          hostCity: data.hostCity,
          hostPhone: data.hostPhone,
          hostEmail: data.hostEmail,
          guestName: hostFullName,
          guestEmail: data.hostEmail,
          guestPhone: data.hostPhone,
          guestAddress: hostAddress,
          eventDate: new Date(data.eventDate),
          eventType: data.eventType,
          eventStartTime: data.eventStartTime,
          eventEndTime: ENFORCED_END_TIME,
          startMeal: data.startMeal,
          numberOfGuests: data.numberOfGuests,
          paymentMethod: data.paymentMethod,
          extrasSelection: validExtras.length ? JSON.stringify(validExtras) : null,
          extrasSnapshot: extrasSnapshot.length
            ? (extrasSnapshot as Prisma.InputJsonValue)
            : undefined,
          extras: data.notes,
          priceEstimate: normalizeNumber(pricing.base),
          totalPrice: normalizeNumber(pricing.total),
          privacyAcceptedAt: data.privacyAccepted ? new Date() : null,
          termsAcceptedAt: data.termsAccepted ? new Date() : null,
          termsSnapshot: data.termsAccepted ? termsText : null
        }
      });

      if (inviteToken) {
        await consumeInviteTokenForReservation(inviteToken, reservation.id, tx);
      }

      await tx.signature.create({
        data: {
          reservationId: reservation.id,
          type: SignatureType.HOST,
          imageData: parseSignature(data.signature)
        }
      });

      return tx.reservationRequest.findUnique({
        where: { id: reservation.id },
        include: { signatures: true }
      });
    });
  } catch (error: any) {
    const map: Record<string, string> = {
      TOKEN_INVALID: 'TOKEN_INVALID',
      TOKEN_REVOKED: 'TOKEN_INVALID',
      TOKEN_EXPIRED: 'TOKEN_INVALID',
      TOKEN_USED: 'TOKEN_INVALID'
    };
    const code = map[error?.message];
    if (code) {
      return { success: false, error: code };
    }
    throw error;
  }

  if (!reservationWithSignatures) {
    throw new Error('RESERVATION_CREATION_FAILED');
  }

  const pdf = await reservationToPdf(reservationWithSignatures);
  const eventDateLabel = new Intl.DateTimeFormat('de-DE').format(
    reservationWithSignatures.eventDate
  );
  const extrasForEmail = parseExtrasSnapshot(reservationWithSignatures.extrasSnapshot);
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const extrasListEmail =
    extrasForEmail.length > 0
      ? `<ul>${extrasForEmail
          .map((extra) => {
            const price = euro.format(extra.priceCents / 100);
            const typeLabel = extra.pricingType === 'PER_PERSON' ? 'pro Person' : 'pauschal';
            return `<li>${extra.label} (${typeLabel}) – ${price}</li>`;
          })
          .join('')}</ul>`
      : '<em>Keine</em>';

  const adminEmailTargets = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.SMTP_FROM || '';
  const adminEmails = adminEmailTargets
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (adminEmails?.length) {
    await sendReservationMail({
      reservationId: reservationWithSignatures.id,
      to: adminEmails,
      subject: `Neue Reservierungsanfrage ${reservationWithSignatures.guestName}`,
      html: `<p><strong>Neue Anfrage</strong> von ${reservationWithSignatures.guestName} (${reservationWithSignatures.guestEmail})</p>
        <p>Kontakt: ${reservationWithSignatures.guestPhone ?? '-'} · ${
          reservationWithSignatures.guestAddress ?? '-'
        }</p>
        <p>Veranstaltung: ${eventDateLabel}, ${reservationWithSignatures.eventStartTime} - ${
          reservationWithSignatures.eventEndTime
        } · ${reservationWithSignatures.numberOfGuests} Personen · ${
          reservationWithSignatures.paymentMethod
        }</p>
        <p>Start Essen: ${reservationWithSignatures.startMeal ?? '-'}</p>
        <p>Extras: ${extrasListEmail}</p>
        <p>Bemerkungen / Unverträglichkeiten: ${
          reservationWithSignatures.extras ?? 'Keine Angaben'
        }</p>`,
      attachments: [
        {
          filename: `heidekoenig_reservierung_${reservationWithSignatures.id}.pdf`,
          content: pdf
        }
      ]
    });
  }

  if (process.env.SEND_GUEST_CONFIRMATION === 'true') {
    const template = await getEmailTemplateSettings();
    const vars = {
      guestName: reservationWithSignatures.guestName,
      eventDate: eventDateLabel,
      eventStart: reservationWithSignatures.eventStartTime,
      eventEnd: reservationWithSignatures.eventEndTime,
      reservationId: reservationWithSignatures.id
    };
    const subject = renderTemplate(template.subject, vars);
    const bodyHtml = toHtmlParagraphs(renderTemplate(template.body, vars));

    await sendReservationMail({
      reservationId: reservationWithSignatures.id,
      to: reservationWithSignatures.guestEmail,
      subject,
      html: bodyHtml
    });
  }

  return { success: true, reservationId: reservationWithSignatures.id };
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

export async function deleteReservationRequestsAction(ids: string[]) {
  await assertPermission('edit:requests');
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return { deleted: 0 };

  await prisma.$transaction([
    prisma.signature.deleteMany({ where: { reservationId: { in: uniqueIds } } }),
    prisma.emailLog.deleteMany({ where: { reservationId: { in: uniqueIds } } }),
    prisma.auditLog.deleteMany({ where: { reservationId: { in: uniqueIds } } }),
    prisma.inviteLink.updateMany({
      where: { usedByReservationId: { in: uniqueIds } },
      data: { usedByReservationId: null, usedAt: null }
    }),
    prisma.reservationRequest.deleteMany({ where: { id: { in: uniqueIds } } })
  ]);

  revalidatePath('/admin/requests');
  return { deleted: uniqueIds.length };
}
