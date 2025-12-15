import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInviteLink,
  validateInviteToken,
  consumeInviteTokenForReservation,
  hashToken
} from '@/lib/tokens';

const invites: any[] = [];

vi.mock('@/lib/prisma', () => {
  const prisma = {
    inviteLink: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.tokenHash) return invites.find((i) => i.tokenHash === where.tokenHash);
        if (where.id) return invites.find((i) => i.id === where.id);
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const invite = {
          id: data.id ?? `inv_${invites.length + 1}`,
          tokenHash: data.tokenHash,
          formKey: data.formKey,
          createdAt: new Date(),
          expiresAt: data.expiresAt ?? null,
          usedAt: null,
          usedByReservationId: null,
          createdByUserId: data.createdByUserId ?? null,
          recipientEmail: data.recipientEmail ?? null,
          maxUses: data.maxUses ?? 1,
          useCount: data.useCount ?? 0,
          note: data.note ?? null,
          isRevoked: data.isRevoked ?? false
        };
        invites.push(invite);
        return invite;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        invites.forEach((invite) => {
          const notExpired = !invite.expiresAt || invite.expiresAt > new Date();
          if (
            invite.id === where.id &&
            !invite.isRevoked &&
            notExpired &&
            invite.useCount < invite.maxUses
          ) {
            invite.useCount += data.useCount?.increment ?? 0;
            if (data.usedAt) invite.usedAt = data.usedAt;
            if (data.usedByReservationId) invite.usedByReservationId = data.usedByReservationId;
            count += 1;
          }
        });
        return { count };
      })
    },
    $transaction: async (cb: any) => cb(prisma)
  };
  return { prisma };
});

describe('invite tokens', () => {
  beforeEach(() => {
    invites.splice(0, invites.length);
    process.env.INVITE_TOKEN_SECRET = 'secret';
  });

  it('hashes deterministically', () => {
    const a = hashToken('foo');
    expect(a).toEqual(hashToken('foo'));
  });

  it('validates created invite', async () => {
    const { token } = await createInviteLink({ formKey: 'gesellschaften' });
    const res = await validateInviteToken(token);
    expect(res.valid).toBe(true);
  });

  it('rejects expired invites', async () => {
    const { token } = await createInviteLink({ formKey: 'gesellschaften', expiresInDays: -1 });
    const res = await validateInviteToken(token);
    expect(res.valid).toBe(false);
  });

  it('consumes token and marks used', async () => {
    const { token, invite } = await createInviteLink({ formKey: 'gesellschaften', maxUses: 1 });
    await consumeInviteTokenForReservation(token, 'res1');
    const updated = invites.find((i) => i.id === invite.id);
    expect(updated.useCount).toBe(1);
    expect(updated.usedByReservationId).toBe('res1');
    expect(updated.usedAt).toBeTruthy();
  });

  it('prevents double use', async () => {
    const { token } = await createInviteLink({ formKey: 'gesellschaften', maxUses: 1 });
    const first = consumeInviteTokenForReservation(token, 'resA');
    const second = consumeInviteTokenForReservation(token, 'resB');
    const results = await Promise.allSettled([first, second]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it('rejects revoked token', async () => {
    const { token } = await createInviteLink({ formKey: 'gesellschaften' });
    invites[0].isRevoked = true;
    const res = await validateInviteToken(token);
    expect(res.valid).toBe(false);
  });
});
