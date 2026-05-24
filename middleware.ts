import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: passkey auth gate + route protection.
 *
 * Protects office routes with passkey-based authentication.
 * Public portal routes bypass auth check.
 */

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const path = req.nextUrl.pathname;
  const isAuthPage = path === '/login' || path === '/';
  const isPublic = path.startsWith('/portal/');
  
  if (isPublic) return res;

  const hasPasskey = req.cookies.get('oh_passkey')?.value === 'open';

  if (!hasPasskey && !isAuthPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (hasPasskey && isAuthPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/house';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
