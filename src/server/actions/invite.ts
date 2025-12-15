'use server';

import { assertPermission } from '@/lib/rbac';
import { createInviteLink } from '@/lib/tokens';
import { writeAuditLog } from '@/lib/audit';
import { sendReservationMail } from '@/lib/email';
import { getBaseUrl } from '@/lib/auth';

const defaultHours = Number(process.env.INVITE_LINK_HOURS ?? 48) || 48;

export async function issueInviteLink(reservationId: string, expiresInHours = defaultHours) {
  const session = await assertPermission('edit:requests');
  const token = await createInviteLink(reservationId, session?.user?.id, expiresInHours);
  await writeAuditLog({ reservationId, userId: session.user?.id, action: 'INVITE_LINK' });
  return token;
}

export async function sendInviteLinkEmailAction({
  reservationId,
  recipient,
  expiresInHours,
  appUrl
}: {
  reservationId: string;
  recipient: string;
  expiresInHours?: number;
  appUrl?: string;
}) {
  const session = await assertPermission('send:emails');
  const token = await createInviteLink(reservationId, session.user?.id, expiresInHours ?? defaultHours);
  const base = (appUrl || getBaseUrl()).replace(/\/$/, '');
  const link = `${base}/request?token=${token}`;
  await sendReservationMail({
    reservationId,
    to: recipient,
    subject: 'Reservierungsformular Heidekönig',
    html: `<p>Bitte füllen Sie Ihr Reservierungsformular aus:</p><p><a href="${link}">${link}</a></p>`
  });
  await writeAuditLog({ reservationId, userId: session.user?.id, action: 'INVITE_EMAIL' });
  return { link };
}
