import { describe, it, expect } from 'vitest';
import { can } from '@/lib/rbac';
import { Role } from '@prisma/client';

describe('rbac matrix', () => {
  it('prevents staff from managing users', () => {
    expect(can('manage:users', Role.STAFF)).toBe(false);
  });

  it('allows admins to manage users', () => {
    expect(can('manage:users', Role.ADMIN)).toBe(true);
  });
});
