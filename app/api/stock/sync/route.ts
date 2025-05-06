import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logStock, logSync } from '@/app/utils/logger';
import { StockEventType, emitStockUpdate } from '@/app/utils/websocketServer';

interface StockSyncItem {
  productId: string;
  size: string;
  color: string;
  timestamp?: string;
}

/**
 * GET /api/stock/sync
 * Returns the latest stock information for multiple products with timestamp tracking
 */
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    
    // Get product IDs from query parameters
    const productIds = req.nextUrl.searchParams.get('productIds')?.split(',') || [];
    const clientTimestamp = req.nextUrl.searchParams.get('timestamp');
    
    logSync(`Stock sync request ${requestId}`, 'info', {
      productCount: productIds.length,
      afterOrder,
      clientTimestamp
    });
    
    if (productIds.length === 0) {
      logSync('No product IDs provided for sync', 'warn');
      return NextResponse.json(
        { error: 'No product IDs provided' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Convert string IDs to ObjectIds
    const objectIds = productIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    // Find the products
    const products = await productsCollection.find(
      { _id: { $in: objectIds } },
      { 
        projection: { 
          _id: 1,
          title: 1,
          sizeVariants: 1,
          updatedAt: 1
        }
      }
    ).toArray();
    
    // Process stock information
    const stockData = products.map((product: any) => ({
      productId: product._id.toString(),
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
    }));
    
    // Find missing products
    const foundProductIds = stockData.map((item: any) => item.productId);
    const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Prepare response with timestamp information
    const response = NextResponse.json({
      products: stockData,
      missingProductIds: missingProductIds.length > 0 ? missingProductIds : undefined,
      timestamp: new Date().toISOString(),
      processingTime,
      requestId,
      afterOrder
    });
    
    // Set cache control headers
    response.headers.set('Cache-Control', afterOrder ? 'no-cache, no-store, must-revalidate' : 'max-age=10');
    response.headers.set('Pragma', afterOrder ? 'no-cache' : 'cache');
    response.headers.set('X-Stock-Timestamp', Date.now().toString());
    
    // Log the results
    logSync(`Stock sync request ${requestId} completed`, 'info', {
      productCount: stockData.length,
      missingCount: missingProductIds.length,
      processingTime
    });
    
    return response;
    
  } catch (error: any) {
    logSync('Stock sync API error:', 'error', error);
    
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
 * POST /api/stock/sync
 * Validates and updates stock information for multiple products
 */
export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    
    // Parse request body
    const body = await req.json();
    const items: StockSyncItem[] = body.items || [];
    
    logSync(`Stock sync update request ${requestId}`, 'info', {
      itemCount: items.length,
      afterOrder
    });
    
    if (items.length === 0) {
      logSync('No items provided for sync update', 'warn');
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Process each item
    const results = [];
    const errors = [];
    
    for (const item of items) {
      const { productId, size, color } = item;
      
      if (!productId || !size || !color) {
        errors.push({ item, error: 'Missing required fields' });
        continue;
      }
      
      try {
        if (!ObjectId.isValid(productId)) {
          errors.push({ item, error: 'Invalid product ID' });
          continue;
        }
        
        // Find the product to get current stock
        const product = await productsCollection.findOne(
          { _id: new ObjectId(productId) },
          { projection: { sizeVariants: 1 } }
        );
        
        if (!product) {
          errors.push({ item, error: 'Product not found' });
          continue;
        }
        
        // Find the size variant
        const sizeVariant = product.sizeVariants?.find(
          (sv: any) => sv.size === size
        );
        
        if (!sizeVariant) {
          errors.push({ item, error: 'Size variant not found' });
          continue;
        }
        
        // Find the color variant
        const colorVariant = sizeVariant.colorVariants?.find(
          (cv: any) => cv.color === color
        );
        
        if (!colorVariant) {
          errors.push({ item, error: 'Color variant not found' });
          continue;
        }
        
        // Record current stock for response
        const currentStock = colorVariant.stock;
        
        // Update the product with timestamp
        const updateResult = await productsCollection.updateOne(
          { 
            _id: new ObjectId(productId),
            "sizeVariants.size": size,
            "sizeVariants.colorVariants.color": color
          },
          { 
            $set: { 
              updatedAt: new Date().toISOString()
            } 
          }
        );
        
        if (updateResult.matchedCount === 0) {
          errors.push({ item, error: 'Failed to update product' });
          continue;
        }
        
        // Emit WebSocket event for real-time updates
        try {
          emitStockUpdate(StockEventType.STOCK_UPDATED, {
            productId,
            size,
            color,
            currentStock,
            timestamp: new Date().toISOString()
          });
        } catch (wsError) {
          logSync(`Failed to emit WebSocket event for product ${productId}`, 'warn', wsError);
          // Continue processing even if WebSocket emission fails
        }
        
        results.push({
          productId,
          size,
          color,
          currentStock,
          status: 'success',
          timestamp: new Date().toISOString()
        });
        
      } catch (itemError: any) {
        logSync('Error processing sync item:', 'error', itemError);
        errors.push({ 
          item, 
          error: `Error processing item: ${itemError.message}` 
        });
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Prepare response with timestamp information
    const response = NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      processingTime,
      requestId,
      afterOrder
    });
    
    // Set cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Stock-Timestamp', Date.now().toString());
    
    // Log the results
    logSync(`Stock sync update request ${requestId} completed`, 'info', {
      success: errors.length === 0,
      resultsCount: results.length,
      errorsCount: errors.length,
      processingTime
    });
    
    return response;
    
  } catch (error: any) {
    logSync('Stock sync update API error:', 'error', error);
    
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
