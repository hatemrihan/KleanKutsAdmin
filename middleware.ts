import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Skip middleware for these specific paths
  if (pathname.startsWith('/test') || 
      pathname.startsWith('/test-settings') ||
      pathname.startsWith('/api/auth') ||  // Allow auth API routes 
      pathname === '/') {
    console.log('Middleware: Bypassing auth check for:', pathname);
    return NextResponse.next();
  }
  
  // For all protected routes check authentication
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
  
  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public|api/auth/check|api/auth/admin-login).*)',
  ]
}; 