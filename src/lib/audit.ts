import { prisma } from './prisma';

export async function writeAuditLog(params: { userId?: string; reservationId: string; action: string }) {
  await prisma.auditLog.create({
    data: {
      reservationId: params.reservationId,
      userId: params.userId,
      action: params.action
    }
  });
}
