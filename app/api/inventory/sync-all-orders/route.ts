import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';

/**
 * API endpoint to update inventory from all orders
 * This is used to ensure all inventory is properly synchronized
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    // Get all orders that might need inventory updates
    const orders = await db.collection('orders').find({
      $or: [
        // Orders in processing, shipped, or delivered status
        { status: { $in: ['processing', 'shipped', 'delivered'] } },
        // Pending orders created in the last 24 hours
        {
          status: 'pending',
          createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      ]
    }).toArray();
    
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No orders found that need inventory updates',
        updatedCount: 0
      });
    }
    
    // Count total products that need updating
    let totalProductsToUpdate = 0;
    let totalProductsUpdated = 0;
    const ordersWithInventoryToUpdate = [];
    
    // Find orders with products that need inventory updates
    for (const order of orders) {
      if (!Array.isArray(order.products)) continue;
      
      const productsNeedingUpdate = order.products.filter(
        (product: any) => !product.inventoryUpdated
      );
      
      if (productsNeedingUpdate.length > 0) {
        totalProductsToUpdate += productsNeedingUpdate.length;
        ordersWithInventoryToUpdate.push({
          orderId: order._id.toString(),
          productCount: productsNeedingUpdate.length
        });
      }
    }
    
    // Process each order that needs updating
    for (const orderInfo of ordersWithInventoryToUpdate) {
      try {
        // Call the update-from-order API endpoint for each order
        const response = await fetch(`${req.nextUrl.origin}/api/inventory/update-from-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: orderInfo.orderId
          })
        });
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.updatedProducts)) {
          totalProductsUpdated += result.updatedProducts.length;
        }
      } catch (orderError) {
        console.error(`Error processing order ${orderInfo.orderId}:`, orderError);
      }
    }
    
    return NextResponse.json({
      success: true,
      orders: {
        total: orders.length,
        needingUpdates: ordersWithInventoryToUpdate.length
      },
      products: {
        needingUpdates: totalProductsToUpdate,
        updated: totalProductsUpdated
      },
      ordersUpdated: ordersWithInventoryToUpdate.map(o => o.orderId)
    });
    
  } catch (error: any) {
    console.error('Error in GET /api/inventory/sync-all-orders:', error);
    return NextResponse.json(
      { error: `Failed to synchronize inventory: ${error.message}` },
      { status: 500 }
    );
  }
} 