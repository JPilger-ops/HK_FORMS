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
  const isAsset =
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/assets');

  const isFormHost = formUrl && host === formUrl.host;
  const isAdminHost = adminUrl && host === adminUrl.host;

  if (isFormHost) {
    const allowed =
      isAsset ||
      pathname.startsWith('/request') ||
      pathname.startsWith('/api/invites/validate') ||
      pathname === '/not-found';
    if (!allowed) {
      const url = new URL('/not-found', request.url);
      return NextResponse.rewrite(url, { status: 404 });
    }
    return NextResponse.next();
  }

  if (isAdminHost) {
    // Auf Admin-Domain dürfen Admin-Routen; Anfrage-Routen werden (wie bisher) auf die Formular-Domain gelegt.
    if (pathname.startsWith('/request') && formUrl) {
      const redirectUrl = new URL(request.nextUrl.toString());
      redirectUrl.protocol = formUrl.protocol;
      redirectUrl.hostname = formUrl.hostname;
      redirectUrl.port = formUrl.port;
      return NextResponse.redirect(redirectUrl, 308);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/request/:path*', '/admin/:path*', '/api/auth/:path*']
};
