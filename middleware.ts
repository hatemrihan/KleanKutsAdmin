import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-protected routes and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/' ||
    pathname === '/test-settings'
  ) {
    return NextResponse.next();
  }

  // Skip middleware for ALL API routes - admin APIs should always work
  // The site status only controls the e-commerce site, NOT the admin site
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check authentication for admin routes only
  const authCookie = request.cookies.get('admin-auth');
  if (!authCookie || authCookie.value !== 'true') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|api/auth/check|api/auth/admin-login).*)',
  ]
};