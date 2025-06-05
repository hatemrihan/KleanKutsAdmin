import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins for your application
const ALLOWED_ORIGINS = [
  'https://elevee.netlify.app',
  'https://eleveadmin.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

/**
 * Get CORS headers based on the request origin
 * Returns appropriate Access-Control-Allow-Origin header for the requesting origin
 */
export function getCorsHeaders(request?: NextRequest | Request): HeadersInit {
  let origin = '*'; // Default fallback
  
  if (request) {
    const requestOrigin = request.headers.get('origin');
    
    // If the request origin is in our allowed list, use it
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
      origin = requestOrigin;
    } else if (ALLOWED_ORIGINS.length > 0) {
      // Fallback to the first production origin for e-commerce site
      origin = 'https://elevee.netlify.app';
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
  };
}

/**
 * Create a NextJS response with CORS headers
 */
export function responseWithCors(
  data: any, 
  status = 200, 
  request?: NextRequest | Request
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(request)
  });
}

/**
 * Handle CORS preflight OPTIONS requests
 * This is critical for production CORS to work properly
 */
export function handleCorsOptions(request?: NextRequest | Request): NextResponse {
  console.log('[CORS] Handling OPTIONS preflight request');
  
  if (request) {
    const origin = request.headers.get('origin');
    const method = request.headers.get('access-control-request-method');
    const headers = request.headers.get('access-control-request-headers');
    
    console.log('[CORS] Preflight details:', {
      origin,
      method,
      headers,
      url: request.url
    });
  }
  
  return new NextResponse(null, {
    status: 204, // No Content for preflight
    headers: getCorsHeaders(request)
  });
}

/**
 * Add CORS headers to an existing NextResponse
 */
export function addCorsHeaders(
  response: NextResponse, 
  request?: NextRequest | Request
): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
} 