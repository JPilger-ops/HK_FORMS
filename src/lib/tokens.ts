import crypto from 'crypto';
import { prisma } from './prisma';
import { addDays } from 'date-fns/addDays';
import { isBefore } from 'date-fns/isBefore';

const defaultInviteDays = Number(process.env.INVITE_DEFAULT_EXPIRY_DAYS ?? 7) || 7;

function getSecret() {
  const secret = process.env.INVITE_TOKEN_SECRET;
  if (!secret) {
    throw new Error('INVITE_TOKEN_SECRET missing');
  }
  return secret;
}

export function generateToken() {
  // 32 bytes, base64url
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(token);
  return hmac.digest('hex');
}

export type InviteOptions = {
  formKey: string;
  createdByUserId?: string;
  recipientEmail?: string | null;
  expiresInDays?: number;
  note?: string | null;
  maxUses?: number;
};

export async function createInviteLink({
  formKey,
  createdByUserId,
  recipientEmail,
  expiresInDays = defaultInviteDays,
  note,
  maxUses = 1
}: InviteOptions) {
  const token = generateToken();
  const hash = hashToken(token);
  const expiresAt = expiresInDays ? addDays(new Date(), expiresInDays) : null;
  const invite = await prisma.inviteLink.create({
    data: {
      formKey,
      tokenHash: hash,
      createdByUserId,
      recipientEmail: recipientEmail ?? null,
      expiresAt,
      note: note ?? null,
      maxUses
    }
  });
  return { token, invite };
}

export type InviteValidation =
  | { valid: true; formKey: string; inviteId: string; useCount: number; maxUses: number }
  | { valid: false; reason: 'invalid' | 'expired' | 'revoked' | 'used' };

export async function validateInviteToken(token: string): Promise<InviteValidation> {
  if (!token) return { valid: false, reason: 'invalid' };
  const hash = hashToken(token);
  const invite = await prisma.inviteLink.findUnique({ where: { tokenHash: hash } });
  if (!invite) return { valid: false, reason: 'invalid' };
  if (invite.isRevoked) return { valid: false, reason: 'revoked' };
  if (invite.expiresAt && isBefore(invite.expiresAt, new Date()))
    return { valid: false, reason: 'expired' };
  if (invite.useCount >= invite.maxUses) return { valid: false, reason: 'used' };
  return {
    valid: true,
    formKey: invite.formKey,
    inviteId: invite.id,
    useCount: invite.useCount,
    maxUses: invite.maxUses
  };
}

export async function consumeInviteTokenForReservation(token: string, reservationId: string) {
  const hash = hashToken(token);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const invite = await tx.inviteLink.findUnique({ where: { tokenHash: hash } });
    if (!invite) throw new Error('TOKEN_INVALID');
    if (invite.isRevoked) throw new Error('TOKEN_REVOKED');
    if (invite.expiresAt && isBefore(invite.expiresAt, now)) throw new Error('TOKEN_EXPIRED');
    const updated = await tx.inviteLink.updateMany({
      where: {
        id: invite.id,
        isRevoked: false,
        useCount: { lt: invite.maxUses },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      },
      data: {
        useCount: { increment: 1 },
        usedAt: invite.useCount + 1 >= invite.maxUses ? now : invite.usedAt,
        usedByReservationId: reservationId
      }
    });
    if (updated.count === 0) {
      throw new Error('TOKEN_USED');
    }
    return invite;
  });
}
