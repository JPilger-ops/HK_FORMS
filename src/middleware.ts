import { NextRequest, NextResponse } from 'next/server';

const enforceRouting = process.env.ENFORCE_DOMAIN_ROUTING !== 'false';

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const adminUrl =
  safeUrl(process.env.ADMIN_BASE_URL) ||
  safeUrl(process.env.APP_URL) ||
  safeUrl(process.env.NEXTAUTH_URL);
const formUrl = safeUrl(process.env.PUBLIC_FORM_URL) || safeUrl(process.env.FORM_BASE_URL);

export function middleware(request: NextRequest) {
  if (!enforceRouting || process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const host = request.headers.get('host');
  const { pathname } = request.nextUrl;
  let target: URL | null = null;

  if (formUrl && pathname.startsWith('/request')) {
    target = formUrl;
  } else if (adminUrl && (pathname.startsWith('/admin') || pathname.startsWith('/api/auth'))) {
    target = adminUrl;
  }

  if (target && host && host !== target.host) {
    const redirectUrl = new URL(request.nextUrl.toString());
    redirectUrl.protocol = target.protocol;
    redirectUrl.hostname = target.hostname;
    redirectUrl.port = target.port;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/request/:path*', '/admin/:path*', '/api/auth/:path*']
};
