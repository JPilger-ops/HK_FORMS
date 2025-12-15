import crypto from 'crypto';
import { prisma } from './prisma';
import { addHours, isBefore } from 'date-fns';

const defaultInviteHours = Number(process.env.INVITE_LINK_HOURS ?? 48) || 48;

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createInviteLink(
  reservationId: string,
  createdByUserId?: string,
  hoursValid = defaultInviteHours
) {
  const token = generateToken();
  const hash = hashToken(token);
  const expiresAt = addHours(new Date(), hoursValid);
  await prisma.inviteLink.create({
    data: {
      reservationId,
      tokenHash: hash,
      expiresAt,
      createdByUserId
    }
  });
  return token;
}

export async function consumeInviteToken(token: string) {
  const hash = hashToken(token);
  const link = await prisma.inviteLink.findUnique({ where: { tokenHash: hash } });
  if (!link) return null;
  if (link.expiresAt && isBefore(link.expiresAt, new Date())) {
    return null;
  }
  if (link.usedAt) {
    return null;
  }
  await prisma.inviteLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
  return link;
}
