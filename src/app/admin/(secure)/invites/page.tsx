import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { InvitesManager } from '@/components/admin/invites-manager';

export default async function InvitesPage() {
  await assertPermission('view:requests');
  const invites = await prisma.inviteLink.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  const defaultDays = Number(process.env.INVITE_DEFAULT_EXPIRY_DAYS ?? 7);
  const inviteData = invites.map((invite) => ({
    id: invite.id,
    recipientEmail: invite.recipientEmail,
    formKey: invite.formKey,
    useCount: invite.useCount,
    maxUses: invite.maxUses,
    expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
    note: invite.note,
    isRevoked: invite.isRevoked,
    createdAt: invite.createdAt.toISOString()
  }));

  return (
    <AdminShell>
      <InvitesManager invites={inviteData} defaultDays={defaultDays} />
    </AdminShell>
  );
}
