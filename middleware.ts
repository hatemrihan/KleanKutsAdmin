import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for critical assets and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/' ||
    pathname === '/test-settings' ||
    pathname.startsWith('/admin') // Skip for admin routes
  ) {
    return NextResponse.next();
  }

  // CRITICAL: Always allow these APIs regardless of site status
  const allowedApisPaths = [
    '/api/site-status',    // For checking site status
    '/api/waitlist',       // For collecting emails during maintenance
    '/api/settings/site-status' // For admin site status management
  ];

  // If this is an allowed API, let it pass through
  if (allowedApisPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For other API routes, check site status before allowing
  if (pathname.startsWith('/api/')) {
    try {
      // Check site status from database
      const siteStatusResponse = await fetch(new URL('/api/site-status', request.url), {
        method: 'GET',
        headers: {
          'origin': request.headers.get('origin') || '',
          'user-agent': request.headers.get('user-agent') || ''
        }
      });

      if (siteStatusResponse.ok) {
        const statusData = await siteStatusResponse.json();
        
        // If site is inactive, block non-essential APIs
        if (statusData.status === 'inactive') {
          return NextResponse.json(
            { 
              error: 'Site is currently in maintenance mode. Only waitlist functionality is available.',
              status: 'maintenance' 
            }, 
            { status: 503 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking site status in middleware:', error);
      // If we can't check status, allow the request to proceed (fail-safe)
    }
  }

  // Check authentication for admin routes
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