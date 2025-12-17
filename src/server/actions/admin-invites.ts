'use server';

import { assertPermission } from '@/lib/rbac';
import { createInviteLink, validateInviteToken } from '@/lib/tokens';
import { sendInviteEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getPublicFormBaseUrl } from '@/lib/auth';

export async function createAndSendInviteAction({
  recipientEmail,
  formKey,
  expiresInDays,
  note,
  maxUses
}: {
  recipientEmail: string;
  formKey: string;
  expiresInDays?: number;
  note?: string;
  maxUses?: number;
}) {
  const session = await assertPermission('send:emails');
  if (!recipientEmail) {
    throw new Error('Recipient required');
  }
  const formBase = getPublicFormBaseUrl().replace(/\/$/, '');
  const { token, invite } = await createInviteLink({
    formKey,
    createdByUserId: session.user?.id,
    recipientEmail,
    expiresInDays,
    note,
    maxUses
  });
  await sendInviteEmail({
    inviteId: invite.id,
    to: recipientEmail,
    token,
    formKey,
    appUrl: formBase
  });
  return { inviteId: invite.id, link: `${formBase}/request?token=${token}` };
}

export async function revokeInviteAction(inviteId: string) {
  await assertPermission('edit:requests');
  await prisma.inviteLink.update({
    where: { id: inviteId },
    data: { isRevoked: true }
  });
}

export async function resendInviteAction(inviteId: string) {
  const session = await assertPermission('send:emails');
  const invite = await prisma.inviteLink.findUnique({ where: { id: inviteId } });
  if (!invite || !invite.recipientEmail) {
    throw new Error('Invite not found or no recipient');
  }
  const formBase = getPublicFormBaseUrl().replace(/\/$/, '');
  const { token, invite: newInvite } = await createInviteLink({
    formKey: invite.formKey,
    createdByUserId: session.user?.id,
    recipientEmail: invite.recipientEmail,
    expiresInDays: invite.expiresAt
      ? Math.max(1, Math.ceil((invite.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined,
    note: invite.note,
    maxUses: invite.maxUses
  });
  await sendInviteEmail({
    inviteId: newInvite.id,
    to: invite.recipientEmail,
    token,
    formKey: invite.formKey,
    appUrl: formBase
  });
  return {
    inviteId: newInvite.id,
    link: `${formBase}/request?token=${token}`
  };
}

export async function listInvitesAction(limit = 50) {
  await assertPermission('view:requests');
  return prisma.inviteLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function validateInviteForApi(token: string) {
  return validateInviteToken(token);
}
