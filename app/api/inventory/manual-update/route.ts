import { NextRequest, NextResponse } from 'next/server';
import { updateInventoryFromOrder } from '../../../lib/inventory/service';
import { logStock } from '@/app/utils/logger';

/**
 * API endpoint to manually force inventory update for a specific order
 * This ensures inventory is properly reduced when automatic processes fail
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, forceUpdate = false } = await req.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`Manual inventory update triggered for order ${orderId}`);
    logStock(`Manual inventory update triggered for order ${orderId}`, 'info', { orderId, forceUpdate });
    
    // Use the unified inventory service with force update option
    const result = await updateInventoryFromOrder(orderId, forceUpdate);
    
    if (!result.success) {
      console.error(`Error updating inventory for order ${orderId}:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    console.log(`Successfully updated inventory for order ${orderId}`);
    
    return NextResponse.json({
      success: true,
      orderId,
      updatedProducts: result.results,
      errors: result.errors
    });
    
  } catch (error: any) {
    console.error('Error in manual inventory update:', error);
    return NextResponse.json(
      { error: `Failed to update inventory: ${error.message}` },
      { status: 500 }
    );
  }
} 