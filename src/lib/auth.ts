import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions, Session } from 'next-auth';
import { compare } from './crypto';
import { prisma } from './prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { cookies, headers } from 'next/headers';
import { checkRateLimit } from './rate-limit';
import { getAutoLogoutMinutes } from './config';

const SESSION_MAX_AGE_SECONDS = Math.max(5, getAutoLogoutMinutes()) * 60;

export const authOptions: NextAuthOptions & { trustHost?: boolean } = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'text' },
        password: { label: 'Passwort', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const key = `login:${credentials.email}`;
        if (!checkRateLimit(key)) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          return null;
        }

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role
        } as any;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/admin/login'
  },
  // trust proxy headers (required behind Nginx/Proxy Manager)
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = 'role' in user ? (user as any).role : Role.STAFF;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Session['user'] & { role?: Role }).role = token.role as Role;
      }
      return session;
    }
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: undefined
      }
    }
  },
  events: {},
  logger: {
    warn(code) {
      console.warn(code);
    },
    error(code) {
      console.error(code);
    }
  }
};

export async function requireSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function getSessionUser() {
  const session = await requireSession();
  return session?.user;
}

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function headerBaseUrl() {
  const h = headers();
  const proto = h.get('x-forwarded-proto');
  const forwardedHost = h.get('x-forwarded-host');
  const host = h.get('host');
  return proto && (forwardedHost || host) ? `${proto}://${forwardedHost || host}` : null;
}

const localFallback = `http://localhost:${process.env.PORT ?? 3000}`;

export function getAdminBaseUrl() {
  const cookie = cookies().get('APP_URL')?.value;
  return (
    headerBaseUrl() ||
    normalizeUrl(cookie) ||
    normalizeUrl(process.env.ADMIN_BASE_URL) ||
    normalizeUrl(process.env.APP_URL) ||
    normalizeUrl(process.env.NEXTAUTH_URL) ||
    localFallback
  ).replace(/\/$/, '');
}

export function getPublicFormBaseUrl() {
  return (
    normalizeUrl(process.env.PUBLIC_FORM_URL) ||
    normalizeUrl(process.env.FORM_BASE_URL) ||
    normalizeUrl(process.env.NEXT_PUBLIC_FORM_URL) ||
    normalizeUrl(process.env.APP_URL) ||
    normalizeUrl(process.env.NEXTAUTH_URL) ||
    normalizeUrl(headerBaseUrl()) ||
    localFallback
  ).replace(/\/$/, '');
}

export function getBaseUrl() {
  return getAdminBaseUrl();
}

export const getTrustedProxyHeaders = getBaseUrl;
