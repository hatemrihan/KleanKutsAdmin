import { NextRequest, NextResponse } from 'next/server';
import { logSync } from '@/app/utils/logger';
import { StockEventType, emitStockUpdate, getConnectedClientsCount } from '@/app/utils/websocketServer';

// Enhanced WebSocket API endpoint
// This route provides HTTP endpoints for stock synchronization
// while the actual WebSocket server is initialized in the server startup code

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const connectionCount = getConnectedClientsCount();
  
  logSync('WebSocket status check', 'info', { timestamp, connectionCount });
  
  const response = NextResponse.json({
    status: 'ready',
    message: 'WebSocket endpoint is ready for connection',
    timestamp,
    connectionCount,
    supportsRealTimeStock: true
  });
  
  // Set cache control headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const requestId = Math.random().toString(36).substring(2, 15);
    const afterOrder = req.nextUrl.searchParams.get('afterOrder') === 'true';
    const timestamp = new Date().toISOString();
    
    logSync(`Stock broadcast request ${requestId} started`, 'info', { afterOrder, timestamp });
    
    const body = await req.json();
    const { productId, eventType, updates } = body;
    
    if (!productId || !updates) {
      logSync(`Invalid request: missing required fields`, 'error', { body });
      return NextResponse.json(
        { error: 'Invalid request: productId and updates are required' },
        { status: 400 }
      );
    }
    
    // Determine the event type to emit
    const stockEventType = eventType || StockEventType.STOCK_UPDATED;
    
    // Emit the event through our WebSocket utility
    const emitResult = emitStockUpdate(stockEventType, {
      productId,
      updates,
      timestamp,
      afterOrder,
      requestId
    });
    
    logSync(`Stock update broadcast attempt for product ${productId}`, 'info', { 
      eventType: stockEventType,
      success: emitResult,
      updates
    });
    
    // Return response with cache control headers
    const response = NextResponse.json({
      success: emitResult,
      message: emitResult 
        ? 'Stock update broadcasted to all connected clients' 
        : 'Stock update received but WebSocket server not initialized',
      productId,
      eventType: stockEventType,
      timestamp,
      requestId
    });
    
    // Set cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
    
  } catch (error: any) {
    logSync('WebSocket broadcast error:', 'error', error);
    
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
