import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the route is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/products') ||
                      request.nextUrl.pathname.startsWith('/categories') ||
                      request.nextUrl.pathname.startsWith('/orders') ||
                      request.nextUrl.pathname.startsWith('/settings');

  // Get the admin auth cookie
  const adminAuth = request.cookies.get('admin-auth');
  
  // For deployments, also check localStorage if cookie isn't present
  // Skip the auth check for now to debug the routing issue
  if (isAdminRoute && !adminAuth?.value) {
    // Instead of redirecting, let's continue the request for debugging
    // return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/orders/:path*',
    '/settings/:path*'
  ]
}; 