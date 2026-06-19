import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';

/**
 * Route protection.
 *
 * API routes are default-deny: a route must be explicitly listed as public or
 * company-scoped, otherwise it is rejected. This keeps any unlisted or legacy
 * endpoint from being reachable without auth.
 *
 * Pages: the company and worker areas require the matching session; everything
 * else (landing, login, help, public invite and audit links) is open.
 */

// API routes that authorize themselves: public login and health, or handlers
// that validate their own scoped token or session ownership downstream.
const PUBLIC_API = [
  '/api/health',
  '/api/auth', // login, logout, demo, privy; company-only ones self-check the role
  '/api/audit', // validated by the audit token downstream
  '/api/receipt', // validated by session ownership or audit token downstream
  '/api/invite', // public onboarding, validated by the invite token downstream
];

// API routes that require a company session.
const COMPANY_API = ['/api/company', '/api/contractors', '/api/payroll'];

const COMPANY_PAGES = [
  '/dashboard',
  '/payroll',
  '/contractors',
  '/receipts',
  '/settings',
  '/onboarding',
];
const WORKER_PAGES = ['/payments'];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function loginRedirect(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API: default-deny.
  if (pathname.startsWith('/api')) {
    if (matches(pathname, PUBLIC_API)) return NextResponse.next();
    if (matches(pathname, COMPANY_API)) {
      const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
      if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      if (session.role !== 'company') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      return NextResponse.next();
    }
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Pages.
  const isCompanyPage = matches(pathname, COMPANY_PAGES);
  const isWorkerPage = matches(pathname, WORKER_PAGES);
  if (!isCompanyPage && !isWorkerPage) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return loginRedirect(req, pathname);
  if (isCompanyPage && session.role !== 'company') return loginRedirect(req, pathname);
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)).*)'],
};
