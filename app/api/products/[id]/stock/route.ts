import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logStock, logApi } from '@/app/utils/logger';

/**
 * GET /api/products/[id]/stock
 * Returns real-time stock information for a specific product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const productId = params.id;
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    
    // Get timestamp from request for cache validation
    const ifModifiedSince = req.headers.get('If-Modified-Since');
    const clientTimestamp = req.nextUrl.searchParams.get('timestamp');
    
    logStock(`Stock info request for product ${productId}`, 'info', {
      afterOrder,
      ifModifiedSince,
      clientTimestamp,
      requestId
    });
    
    if (!ObjectId.isValid(productId)) {
      logStock(`Invalid product ID: ${productId}`, 'error');
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Find the product
    const product = await productsCollection.findOne(
      { _id: new ObjectId(productId) },
      { projection: { 
        title: 1, 
        sizeVariants: 1, 
        updatedAt: 1 
      }}
    );
    
    if (!product) {
      logStock(`Product not found: ${productId}`, 'error');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Extract stock information
    const stockInfo = {
      productId,
      title: product.title,
      lastUpdated: product.updatedAt || new Date().toISOString(),
      variants: product.sizeVariants?.map((sv: any) => ({
        size: sv.size,
        colors: sv.colorVariants?.map((cv: any) => ({
          color: cv.color,
          stock: cv.stock
        }))
      })) || [],
      totalStock: calculateTotalStock(product.sizeVariants)
    };
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Prepare response with timestamp information
    const response = NextResponse.json({
      ...stockInfo,
      timestamp: new Date().toISOString(),
      processingTime,
      requestId
    });
    
    // Set cache control headers
    response.headers.set('Cache-Control', afterOrder ? 'no-cache, no-store, must-revalidate' : 'max-age=10');
    response.headers.set('Pragma', afterOrder ? 'no-cache' : 'cache');
    response.headers.set('X-Stock-Timestamp', Date.now().toString());
    response.headers.set('Last-Modified', new Date(stockInfo.lastUpdated).toUTCString());
    
    // Log the results
    logStock(`Stock info request for product ${productId} completed`, 'info', {
      processingTime,
      totalStock: stockInfo.totalStock,
      variantCount: stockInfo.variants.length
    });
    
    return response;
    
  } catch (error: any) {
    logStock('Product stock API error:', 'error', error);
    
    const response = NextResponse.json(
      { 
        error: `Server error: ${error.message}`,
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
    
    // Set cache control headers for errors
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  }
}

/**
 * Calculate total stock across all size and color variants
 */
function calculateTotalStock(sizeVariants: any[] = []): number {
  return sizeVariants.reduce((total, sizeVariant) => {
    return total + (sizeVariant.colorVariants || []).reduce((sizeTotal: number, colorVariant: any) => {
      return sizeTotal + (Number(colorVariant.stock) || 0);
    }, 0);
  }, 0);
}
