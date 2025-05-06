import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logStock, logApi } from '@/app/utils/logger';
import { StockEventType, emitStockUpdate } from '@/app/utils/websocketServer';

interface StockInfo {
  originalStock: number;
  size: string;
  color: string;
}

interface StockValidationItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  _stockInfo?: StockInfo;
}

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    
    // Parse request body
    const body = await req.json();
    const items: StockValidationItem[] = body.items;
    
    logApi(`Stock validation request ${requestId} started`, 'info', { 
      itemCount: items?.length || 0,
      afterOrder,
      url: req.url
    });
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      logApi(`Stock validation request ${requestId} failed: Invalid items array`, 'error');
      return NextResponse.json(
        { error: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Validate each item
    const validItems = [];
    const invalidItems = [];
    
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || !color || !quantity) {
        invalidItems.push({ 
          item, 
          error: 'Missing required fields' 
        });
        continue;
      }
      
      try {
        // Find the product
        const product = await productsCollection.findOne({ 
          _id: new ObjectId(productId) 
        });
        
        if (!product) {
          invalidItems.push({ 
            item, 
            error: 'Product not found' 
          });
          continue;
        }
        
        // Find the size variant
        const sizeVariant = product.sizeVariants?.find(
          (sv: any) => sv.size === size
        );
        
        if (!sizeVariant) {
          invalidItems.push({ 
            item, 
            error: 'Size variant not found' 
          });
          continue;
        }
        
        // Find the color variant
        const colorVariant = sizeVariant.colorVariants?.find(
          (cv: any) => cv.color === color
        );
        
        if (!colorVariant) {
          invalidItems.push({ 
            item, 
            error: 'Color variant not found' 
          });
          continue;
        }
        
        // Check if there's enough stock
        if (colorVariant.stock < quantity) {
          invalidItems.push({ 
            item, 
            error: 'Insufficient stock', 
            available: colorVariant.stock,
            requested: quantity
          });
          continue;
        }
        
        // Item is valid
        validItems.push({
          ...item,
          available: colorVariant.stock,
          status: 'valid'
        });
        
      } catch (itemError: any) {
        console.error('Error validating item:', itemError);
        invalidItems.push({ 
          item, 
          error: `Error validating item: ${itemError.message}` 
        });
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Prepare response with timestamp information
    const response = NextResponse.json({
      valid: invalidItems.length === 0,
      validItems,
      invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
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
    logStock(`Stock validation request ${requestId} completed`, 'info', {
      valid: invalidItems.length === 0,
      validItemsCount: validItems.length,
      invalidItemsCount: invalidItems.length,
      processingTime,
      afterOrder
    });
    
    return response;
    
  } catch (error: any) {
    logApi('Stock validation API error:', 'error', error);
    
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
