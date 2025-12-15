import { Role } from '@prisma/client';
import { authOptions } from './auth';
import { getServerSession } from 'next-auth';

export type Permission = 'view:requests' | 'edit:requests' | 'manage:users' | 'send:emails';

const roleMatrix: Record<Role, Permission[]> = {
  [Role.ADMIN]: ['view:requests', 'edit:requests', 'manage:users', 'send:emails'],
  [Role.STAFF]: ['view:requests', 'edit:requests', 'send:emails']
};

export async function assertPermission(permission: Permission) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) {
    throw new Error('UNAUTHORIZED');
  }
  const allowed = roleMatrix[session.user.role].includes(permission);
  if (!allowed) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export function can(permission: Permission, role?: Role) {
  if (!role) return false;
  return roleMatrix[role].includes(permission);
}
