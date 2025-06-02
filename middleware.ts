import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for essential paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/admin') ||
    pathname === '/waitlist'
  ) {
    return NextResponse.next();
  }

  try {
    // Fetch site status with strong cache prevention
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://eleveadmin.netlify.app'}/api/settings/site-status`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch site status');
    }

    const data = await response.json();
    
    // Check if site is inactive and redirect to waitlist
    if (data?.data?.active === false) {
      console.log('Site is inactive, redirecting to waitlist');
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error in middleware:', error);
    // On error, redirect to waitlist as a safety measure
    const url = request.nextUrl.clone();
    url.pathname = '/waitlist';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|api/auth/check|api/auth/admin-login|waitlist).*)',
  ]
};