import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Explicitly bypass orders and settings pages
  const url = request.nextUrl;
  if (url.pathname.startsWith('/orders') || 
      url.pathname.startsWith('/settings') || 
      url.pathname.startsWith('/test') || 
      url.pathname.startsWith('/test-settings')) {
    console.log('Middleware: Bypassing auth for:', url.pathname);
    return NextResponse.next();
  }
  
  // Just let all requests through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/api/:path*'
  ]
}; 