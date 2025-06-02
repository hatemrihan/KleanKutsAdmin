import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware only for essential paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/test-settings') ||
    pathname.startsWith('/waitlist')
  ) {
    return NextResponse.next();
  }

  try {
    // Fetch site status with no-cache headers
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings/site-status`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch site status: ${response.status}`);
    }

    const data = await response.json();

    // If site is inactive, redirect ALL paths (including home page) to waitlist
    if (data?.data?.active === false) {
      console.log('Middleware: Site is inactive, redirecting to waitlist');
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Error checking site status in middleware:', error);
    // On error, allow the request to proceed
    return NextResponse.next();
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Update matcher to include all paths except those that should be excluded
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|api/auth/check|api/auth/admin-login|waitlist).*)',
  ]
};