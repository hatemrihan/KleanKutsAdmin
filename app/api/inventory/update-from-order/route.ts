import { NextRequest, NextResponse } from 'next/server';
import { updateInventoryFromOrder } from '../../../lib/inventory/service';

/**
 * API endpoint to update inventory from an order
 * This ensures inventory is properly reduced when an order is placed
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`Processing inventory update for order ${orderId}`);
    
    // Use the unified inventory service
    const result = await updateInventoryFromOrder(orderId);
    
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
    console.error('Error in POST /api/inventory/update-from-order:', error);
    return NextResponse.json(
      { error: `Failed to update inventory: ${error.message}` },
      { status: 500 }
    );
  }
} 