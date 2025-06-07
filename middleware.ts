import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Skip middleware for these specific paths within the admin panel
  if (pathname.startsWith('/test') || 
      pathname.startsWith('/test-settings') ||
      pathname.startsWith('/api/auth') ||  // Allow auth API routes 
      pathname === '/') {
    console.log('Middleware: Bypassing auth check for:', pathname);
    return NextResponse.next();
  }
  
  // For all protected routes in admin panel, check authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/products') || 
      pathname.startsWith('/categories') || 
      pathname.startsWith('/orders') || 
      pathname.startsWith('/settings') ||
      pathname.startsWith('/ambassadors')) {
    
    // Check for the auth cookie
    const authCookie = request.cookies.get('admin-auth');
    
    // If no auth cookie or it's not valid, redirect to login page
    if (!authCookie || authCookie.value !== 'true') {
      console.log('Middleware: Unauthorized access attempt for:', pathname);
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
  
  // Check for e-commerce site status for non-admin routes
  // This should be checking the front-end routes, not the admin routes
  if (!pathname.startsWith('/api') && 
      !pathname.startsWith('/dashboard') && 
      !pathname.startsWith('/products') && 
      !pathname.startsWith('/categories') && 
      !pathname.startsWith('/orders') && 
      !pathname.startsWith('/settings') && 
      !pathname.startsWith('/test') && 
      !pathname.startsWith('/test-settings') && 
      !pathname.startsWith('/waitlist') && 
      pathname !== '/') {
    
    try {
      // Fetch site status
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings/site-status`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch site status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If site is inactive, redirect to waitlist page
      if (data && data.data && data.data.active === false) {
        console.log('Middleware: Site is inactive, redirecting to waitlist');
        const url = request.nextUrl.clone();
        url.pathname = '/waitlist';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Error checking site status in middleware:', error);
      // On error, continue to allow the request
      // You could choose to redirect to waitlist here as a fallback
    }

  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|api/auth/check|api/auth/admin-login).*)',
  ]
};