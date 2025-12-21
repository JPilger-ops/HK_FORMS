import { NextResponse } from 'next/server';

const HEADER_NAME = 'x-hkforms-crm-token';

export function validateCrmToken(request: Request): NextResponse | null {
  const expected = process.env.CRM_SYNC_TOKEN;
  const provided = request.headers.get(HEADER_NAME);
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function crmUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
