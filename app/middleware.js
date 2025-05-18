import { NextResponse } from 'next/server';
import { getSiteStatus } from './lib/adminIntegration';

// Paths that should always be accessible, even in maintenance mode
const ALWAYS_ACCESSIBLE_PATHS = [
  '/waitlist',      // Waitlist page itself
  '/api/',          // API routes
  '/admin/',        // Admin routes
  '/_next/',        // Next.js assets
  '/favicon.ico',   // Favicon
  '/robots.txt',    // Robots.txt
  '/images/',       // Images
  '/videos/',       // Videos
  '/fonts/',        // Fonts
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the path should always be accessible
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE_PATHS.some(path => pathname.startsWith(path));
  
  if (isAlwaysAccessible) {
    return NextResponse.next();
  }
  
  try {
    // Check the site status
    const siteStatus = await getSiteStatus();
    
    // If site is inactive, redirect to waitlist page
    if (siteStatus.status === 'inactive') {
      const url = request.nextUrl.clone();
      url.pathname = '/waitlist';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Error in middleware checking site status:', error);
    // Continue to site on error (fail open)
  }
  
  // Continue to site
  return NextResponse.next();
}

// Apply this middleware to all routes
export const config = {
  matcher: ['/((?!api/site-status|_next/static|_next/image|favicon.ico).*)'],
}; 