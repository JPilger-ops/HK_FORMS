import { NextResponse } from 'next/server';

import { getCrmSyncToken } from './settings';

const HEADER_NAME = 'x-hkforms-crm-token';

export function crmUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function validateCrmToken(request: Request): Promise<NextResponse | null> {
  const expected = await getCrmSyncToken();
  const provided = request.headers.get(HEADER_NAME);
  if (!expected || !provided || provided !== expected) {
    return crmUnauthorizedResponse();
  }
  return null;
}
