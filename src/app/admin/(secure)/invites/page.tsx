import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import {
  createAndSendInviteAction,
  revokeInviteAction,
  resendInviteAction
} from '@/server/actions/admin-invites';

function status(invite: any) {
  const now = new Date();
  if (invite.isRevoked) return 'revoked';
  if (invite.expiresAt && new Date(invite.expiresAt) < now) return 'expired';
  if (invite.useCount >= invite.maxUses) return 'used';
  return 'active';
}

export default async function InvitesPage() {
  await assertPermission('view:requests');
  const invites = await prisma.inviteLink.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  const defaultDays = Number(process.env.INVITE_DEFAULT_EXPIRY_DAYS ?? 7);

  async function createInvite(formData: FormData) {
    'use server';
    const recipientEmail = (formData.get('recipientEmail') as string) ?? '';
    const formKey = (formData.get('formKey') as string) || 'gesellschaften';
    const expiresInDays = Number(formData.get('expiresInDays')) || defaultDays;
    const note = (formData.get('note') as string) || undefined;
    const maxUses = Number(formData.get('maxUses')) || 1;
    await createAndSendInviteAction({ recipientEmail, formKey, expiresInDays, note, maxUses });
  }

  async function revokeInvite(formData: FormData) {
    'use server';
    const inviteId = formData.get('inviteId') as string;
    await revokeInviteAction(inviteId);
  }

  async function resendInvite(formData: FormData) {
    'use server';
    const inviteId = formData.get('inviteId') as string;
    await resendInviteAction(inviteId);
  }

  return (
    <AdminShell>
      <div className="grid gap-8 md:grid-cols-[1.5fr,1fr]">
        <div>
          <h2 className="text-xl font-semibold">Einladungen</h2>
          <p className="text-sm text-slate-500">Neueste 50 Einladungen</p>
          <div className="mt-4 space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded border p-3 text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{invite.recipientEmail ?? 'Ohne Empfänger'}</p>
                    <p className="text-slate-500">
                      {invite.formKey} · {invite.useCount}/{invite.maxUses} ·{' '}
                      {invite.expiresAt
                        ? `bis ${new Date(invite.expiresAt).toLocaleDateString('de-DE')}`
                        : 'ohne Ablauf'}
                    </p>
                    {invite.note && <p className="text-xs text-slate-500">Notiz: {invite.note}</p>}
                  </div>
                  <span className="text-xs uppercase text-slate-600">{status(invite)}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <form action={resendInvite}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button className="text-brand underline">Neu senden</button>
                  </form>
                  {!invite.isRevoked && (
                    <form action={revokeInvite}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <button className="text-red-600 underline">Widerrufen</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
            {invites.length === 0 && (
              <p className="text-sm text-slate-500">Noch keine Einladungen.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Einladung senden</h2>
          <form action={createInvite} className="mt-4 space-y-3 text-sm">
            <div>
              <label className="block text-slate-600">Empfänger E-Mail</label>
              <input
                name="recipientEmail"
                type="email"
                required
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600">Formular-Key</label>
              <input
                name="formKey"
                defaultValue="gesellschaften"
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600">Ablauf (Tage)</label>
                <input
                  name="expiresInDays"
                  type="number"
                  min={1}
                  defaultValue={defaultDays}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-600">Max. Nutzungen</label>
                <input
                  name="maxUses"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600">Notiz</label>
              <textarea name="note" className="mt-1 w-full rounded border px-3 py-2" rows={2} />
            </div>
            <button className="w-full rounded bg-brand px-4 py-2 font-semibold text-white">
              Einladung senden
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
