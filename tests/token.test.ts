import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from '@/lib/tokens';

describe('invite tokens', () => {
  process.env.INVITE_TOKEN_SECRET = 'secret';
  it('creates unique tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
  });

  it('hashes tokens deterministically', () => {
    const token = generateToken();
    expect(hashToken(token)).toEqual(hashToken(token));
  });
});
