import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';

/**
 * Route protection (MVP).
 *   public:   /, /login, /api/health, /api/auth/*, static
 *   token:    /audit/*, /api/audit/* , /api/receipt  (validated downstream)
 *   company:  /dashboard, /payroll, /api/payroll
 *   any session: /payments
 */
function isCompanyPath(p: string) {
  return p.startsWith('/dashboard') || p.startsWith('/payroll') || p.startsWith('/api/payroll');
}
function isWorkerPath(p: string) {
  return p.startsWith('/payments');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public + token-gated-downstream + auth endpoints pass straight through.
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/audit') ||
    pathname.startsWith('/api/audit') ||
    pathname.startsWith('/api/receipt')
  ) {
    return NextResponse.next();
  }

  if (!isCompanyPath(pathname) && !isWorkerPath(pathname)) {
    return NextResponse.next();
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isCompanyPath(pathname) && session.role !== 'company') {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)).*)'],
};
