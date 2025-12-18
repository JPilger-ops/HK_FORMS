'use server';

import { assertPermission } from '@/lib/rbac';
import { createInviteLink } from '@/lib/tokens';
import { sendInviteEmail } from '@/lib/email';
import { getPublicFormBaseUrl } from '@/lib/auth';

const defaultDays = Number(process.env.INVITE_DEFAULT_EXPIRY_DAYS ?? 7) || 7;

export async function issueInviteLink(
  formKey: string,
  recipientEmail?: string,
  expiresInDays = defaultDays
) {
  const session = await assertPermission('edit:requests');
  const { token } = await createInviteLink({
    formKey,
    createdByUserId: session?.user?.id,
    recipientEmail,
    expiresInDays
  });
  return token;
}

export async function sendInviteLinkEmailAction({
  formKey,
  recipient,
  expiresInDays,
  appUrl
}: {
  formKey: string;
  recipient: string;
  expiresInDays?: number;
  appUrl?: string;
}) {
  const session = await assertPermission('send:emails');
  const { token, invite } = await createInviteLink({
    formKey,
    createdByUserId: session.user?.id,
    recipientEmail: recipient,
    expiresInDays: expiresInDays ?? defaultDays
  });
  const base = (appUrl || getPublicFormBaseUrl()).replace(/\/$/, '');
  await sendInviteEmail({
    inviteId: invite.id,
    to: recipient,
    token,
    formKey,
    appUrl: base,
    expiresAt: invite.expiresAt
  });
  return { link: `${base}/request?token=${token}` };
}
