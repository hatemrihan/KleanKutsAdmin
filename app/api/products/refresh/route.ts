import { NextRequest, NextResponse } from 'next/server';
import { responseWithCors, handleCorsOptions } from '../../../../lib/cors';

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

// POST /api/products/refresh - Force refresh product data cache
export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds)) {
      return responseWithCors(
        { error: 'Product IDs array is required' },
        400,
        request
      );
    }

    // Set cache busting headers to force e-commerce to fetch fresh data
    const response = responseWithCors(
      {
        success: true,
        message: 'Cache refresh triggered',
        productIds,
        timestamp: new Date().toISOString()
      },
      200,
      request
    );

    // Add cache busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Cache-Bust', Date.now().toString());

    return response;
  } catch (error: any) {
    console.error('Error in product refresh:', error);
    return responseWithCors(
      { error: 'Failed to refresh cache' },
      500,
      request
    );
  }
} 