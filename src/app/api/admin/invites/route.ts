import { NextResponse } from 'next/server';
import { assertPermission } from '@/lib/rbac';
import { createInviteLink } from '@/lib/tokens';
import { sendInviteEmail } from '@/lib/email';
import { getBaseUrl } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await assertPermission('send:emails');
  const body = await request.json();
  const recipientEmail = body.recipientEmail as string;
  const formKey = (body.formKey as string) || 'gesellschaften';
  const expiresInDays = body.expiresInDays ? Number(body.expiresInDays) : undefined;
  const note = body.note as string | undefined;
  const maxUses = body.maxUses ? Number(body.maxUses) : undefined;

  if (!recipientEmail) {
    return NextResponse.json({ error: 'recipient required' }, { status: 400 });
  }

  const { token, invite } = await createInviteLink({
    formKey,
    createdByUserId: session.user?.id,
    recipientEmail,
    expiresInDays,
    note,
    maxUses
  });

  const link = `${getBaseUrl().replace(/\/$/, '')}/request?token=${encodeURIComponent(token)}`;
  await sendInviteEmail({
    inviteId: invite.id,
    to: recipientEmail,
    token,
    formKey,
    appUrl: getBaseUrl()
  });

  return NextResponse.json({ inviteId: invite.id, link });
}
