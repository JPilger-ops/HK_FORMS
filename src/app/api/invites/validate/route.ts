import { NextResponse } from 'next/server';
import { validateInviteToken } from '@/lib/tokens';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';
  const validation = await validateInviteToken(token);
  if (!validation.valid) {
    return NextResponse.json({ valid: false, reason: validation.reason }, { status: 400 });
  }
  return NextResponse.json({ valid: true, formKey: validation.formKey });
}
