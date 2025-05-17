import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';

/**
 * API endpoint to fix payment methods and screenshots in orders
 * This helps repair any orders with incorrect payment method information
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    // Find orders with transaction screenshots but wrong payment method
    const ordersToFix = await db.collection('orders').find({
      $or: [
        // Orders with screenshots but wrong payment method
        { transactionScreenshot: { $exists: true, $ne: null }, paymentMethod: { $ne: 'instapay' } },
        // Orders with instapay payment method but missing paymentVerified field
        { paymentMethod: 'instapay', paymentVerified: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${ordersToFix.length} orders with payment method issues`);
    
    // Track results
    const results = {
      totalOrdersChecked: ordersToFix.length,
      ordersFixed: 0,
      details: [] as Array<{orderId: string, changes: any}>
    };
    
    // Fix each order
    for (const order of ordersToFix) {
      try {
        const updates: any = {};
        
        // If order has a screenshot, ensure payment method is set to instapay
        if (order.transactionScreenshot && order.paymentMethod !== 'instapay') {
          updates.paymentMethod = 'instapay';
          console.log(`Setting payment method to instapay for order ${order._id} with screenshot`);
        }
        
        // Ensure paymentVerified field exists for instapay orders
        if (order.paymentMethod === 'instapay' && order.paymentVerified === undefined) {
          updates.paymentVerified = false;
          console.log(`Adding paymentVerified field to order ${order._id}`);
        }
        
        // Only update if we have changes
        if (Object.keys(updates).length > 0) {
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: updates }
          );
          
          results.ordersFixed++;
          results.details.push({
            orderId: order._id.toString(),
            changes: updates
          });
        }
      } catch (orderError) {
        console.error(`Error fixing order ${order._id}:`, orderError);
      }
    }
    
    // Force inventory update for all processed orders
    const processedOrdersIds = await db.collection('orders').find({
      status: { $in: ['processing', 'shipped', 'delivered'] },
    }).project({ _id: 1 }).toArray();
    
    console.log(`Found ${processedOrdersIds.length} processed orders to update inventory`);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl ? req.nextUrl.origin : 'http://localhost:3000'}`;
    
    // Update inventory for each order
    const inventoryUpdates = {
      success: 0,
      failed: 0,
      details: [] as Array<{orderId: string, success: boolean, message?: string}>
    };

    // Update inventory for each order
    for (const orderDoc of processedOrdersIds) {
      try {
        const orderId = orderDoc._id.toString();
        
        // Call inventory update API
        const response = await fetch(`${baseUrl}/api/inventory/update-from-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        });
        
        if (response.ok) {
          console.log(`Successfully updated inventory for order ${orderId}`);
          inventoryUpdates.success++;
          inventoryUpdates.details.push({
            orderId,
            success: true
          });
        } else {
          const errorText = await response.text();
          console.error(`Failed to update inventory for order ${orderId}:`, errorText);
          inventoryUpdates.failed++;
          inventoryUpdates.details.push({
            orderId,
            success: false,
            message: errorText
          });
        }
      } catch (updateError: any) {
        console.error('Error updating inventory:', updateError);
        inventoryUpdates.failed++;
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      message: "Fixed payment methods and triggered inventory updates for processed orders",
      payment: results,
      inventory: {
        processedOrders: processedOrdersIds.length,
        successfulUpdates: inventoryUpdates.success,
        failedUpdates: inventoryUpdates.failed
      }
    });
    
  } catch (error) {
    console.error('Error in fixing order payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fix order payment methods' },
      { status: 500 }
    );
  }
} 