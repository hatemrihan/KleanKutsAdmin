import { NextRequest, NextResponse } from 'next/server';
import { logStock } from '@/app/utils/logger';
import { StockEventType, emitStockReduction } from '@/app/utils/websocketServer';
import { reduceInventory } from '@/app/lib/inventory/service';

interface StockReductionItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    const orderId = req.nextUrl.searchParams.get('orderId') || undefined;
    
    // Parse request body
    const body = await req.json();
    const items: StockReductionItem[] = body.items;
    
    logStock(`Stock reduction request ${requestId} started`, 'info', { 
      itemCount: items?.length || 0,
      afterOrder,
      orderId,
      url: req.url
    });
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      logStock(`Stock reduction request ${requestId} failed: Invalid items array`, 'error');
      return NextResponse.json(
        { error: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }
    
    // Process each item
    const results = [];
    const errors = [];
    
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || !color || !quantity) {
        errors.push({ item, error: 'Missing required fields' });
        continue;
      }
      
      try {
        // Use our unified inventory service
        const transactionId = `stock_${requestId}_${productId}_${size}_${color}`;
        const updateResult = await reduceInventory({
          productId,
          size,
          color,
          quantity,
          transactionId
        });
        
        if (!updateResult.success) {
          logStock(`Failed to update stock for product ${productId}`, 'error', updateResult.error);
          errors.push({ item, error: updateResult.error });
          continue;
        }
        
        // Emit WebSocket event for real-time updates
        try {
          emitStockReduction(productId, size, color, updateResult.newQuantity);
          logStock(`Emitted stock reduction event for product ${productId}`, 'info', {
            size,
            color,
            newStock: updateResult.newQuantity,
            afterOrder
          });
        } catch (wsError) {
          logStock(`Failed to emit WebSocket event for product ${productId}`, 'warn', wsError);
          // Continue processing even if WebSocket emission fails
        }
        
        results.push({
          productId,
          size,
          color,
          quantity,
          newStock: updateResult.newQuantity,
          status: 'success',
          timestamp: new Date().toISOString()
        });
      } catch (itemError: any) {
        logStock('Error processing item:', 'error', itemError);
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
      afterOrder,
      orderId
    });
    
    // Set cache control headers
    response.headers.set('Cache-Control', afterOrder ? 'no-cache, no-store, must-revalidate' : 'max-age=5');
    response.headers.set('Pragma', afterOrder ? 'no-cache' : 'cache');
    response.headers.set('X-Stock-Timestamp', Date.now().toString());
    response.headers.set('X-Stock-Operation', 'reduce');
    
    // Log the results
    logStock(`Stock reduction request ${requestId} completed`, 'info', {
      success: errors.length === 0,
      resultsCount: results.length,
      errorsCount: errors.length,
      processingTime,
      afterOrder,
      orderId
    });
    
    return response;
    
  } catch (error: any) {
    logStock('Stock reduction API error:', 'error', error);
    
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
