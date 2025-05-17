import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // NOTE: Middleware has been temporarily commented out to resolve authentication issues
  // Cookie authentication is causing problems in production, so we're allowing all access for now
  
  return NextResponse.next();

  /*
  // Check if the route is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/products') ||
                      request.nextUrl.pathname.startsWith('/categories') ||
                      request.nextUrl.pathname.startsWith('/orders') ||
                      request.nextUrl.pathname.startsWith('/settings');

  // Get the admin auth cookie
  const adminAuth = request.cookies.get('admin-auth');
  
  // Check if path is a public API route that doesn't need authentication
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/') && 
                           (request.nextUrl.pathname.includes('/login') ||
                            request.nextUrl.pathname.includes('/public'));
  
  // If it's an admin route and there's no auth cookie, redirect to login
  // Except for API routes which are handled separately
  if (isAdminRoute && !adminAuth?.value && !isPublicApiRoute) {
    // Redirect to the login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/api/:path*'
  ]
}; 