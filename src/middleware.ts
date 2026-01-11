import { NextRequest, NextResponse } from 'next/server';

type NetworkConfig = {
  adminBaseUrl: string | null;
  publicFormUrl: string | null;
  enforceDomainRouting: boolean;
};

const envConfig: NetworkConfig = {
  adminBaseUrl:
    (process.env.ADMIN_BASE_URL && safeUrl(process.env.ADMIN_BASE_URL)?.origin) ||
    (process.env.APP_URL && safeUrl(process.env.APP_URL)?.origin) ||
    (process.env.NEXTAUTH_URL && safeUrl(process.env.NEXTAUTH_URL)?.origin) ||
    null,
  publicFormUrl:
    (process.env.PUBLIC_FORM_URL && safeUrl(process.env.PUBLIC_FORM_URL)?.origin) ||
    (process.env.FORM_BASE_URL && safeUrl(process.env.FORM_BASE_URL)?.origin) ||
    null,
  enforceDomainRouting: process.env.ENFORCE_DOMAIN_ROUTING !== 'false'
};

async function loadNetworkConfig(request: NextRequest): Promise<NetworkConfig> {
  try {
    const response = await fetch(new URL('/api/internal/network-config', request.url), {
      cache: 'force-cache',
      next: { revalidate: 30 }
    });
    if (!response.ok) {
      return envConfig;
    }
    const json = (await response.json()) as any;
    return {
      adminBaseUrl: typeof json?.adminBaseUrl === 'string' ? json.adminBaseUrl : envConfig.adminBaseUrl,
      publicFormUrl:
        typeof json?.publicFormUrl === 'string' ? json.publicFormUrl : envConfig.publicFormUrl,
      enforceDomainRouting:
        typeof json?.enforceDomainRouting === 'boolean'
          ? json.enforceDomainRouting
          : envConfig.enforceDomainRouting
    };
  } catch (error) {
    console.error('network config fetch failed', error);
    return envConfig;
  }
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/internal/network-config')) {
    return NextResponse.next();
  }

  const { adminBaseUrl, publicFormUrl, enforceDomainRouting } = await loadNetworkConfig(request);
  if (!enforceDomainRouting || process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const adminUrl = safeUrl(adminBaseUrl);
  const formUrl = safeUrl(publicFormUrl);

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
  matcher: ['/', '/request/:path*', '/admin/:path*', '/api/auth/:path*']
};
