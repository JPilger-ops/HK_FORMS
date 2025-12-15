'use server';

import { prisma } from '@/lib/prisma';
import { assertPermission } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { hash } from '@/lib/crypto';

export async function createUserAction({ email, password, role }: { email: string; password: string; role: Role }) {
  await assertPermission('manage:users');
  const passwordHash = await hash(password);
  return prisma.user.create({ data: { email, passwordHash, role } });
}

export async function listUsersAction() {
  await assertPermission('manage:users');
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}
