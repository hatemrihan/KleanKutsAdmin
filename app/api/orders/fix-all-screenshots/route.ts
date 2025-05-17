import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';

/**
 * Helper function to check if a payment method is InstaPay (case insensitive)
 */
function isInstaPay(method?: string): boolean {
  if (!method) return false;
  return method.toLowerCase().includes('instapay');
}

/**
 * API endpoint to fix ALL orders with screenshots
 * This is a more comprehensive fix than the fix-payment-status endpoint
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    // Find all orders
    const allOrders = await db.collection('orders').find({}).toArray();
    console.log(`Found ${allOrders.length} total orders`);
    
    // Log details of any instapay orders for debugging
    const instapayOrders = allOrders.filter(order => isInstaPay(order.paymentMethod));
    console.log(`Found ${instapayOrders.length} orders with InstaPay payment method`);
    
    if (instapayOrders.length > 0) {
      console.log('Sample InstaPay order:', {
        id: instapayOrders[0]._id,
        paymentMethod: instapayOrders[0].paymentMethod,
        hasScreenshot: !!instapayOrders[0].transactionScreenshot,
        fields: Object.keys(instapayOrders[0]),
      });
    }
    
    // Orders with any kind of screenshot field
    const screenshotOrders = allOrders.filter(order => {
      return order.transactionScreenshot || 
             order.paymentScreenshot || 
             order.screenshot || 
             (order.payment && order.payment.screenshot);
    });
    
    console.log(`Found ${screenshotOrders.length} orders with some kind of screenshot field`);
    
    if (screenshotOrders.length > 0) {
      console.log('Sample screenshot order:', {
        id: screenshotOrders[0]._id,
        paymentMethod: screenshotOrders[0].paymentMethod,
        screenshotUrl: screenshotOrders[0].transactionScreenshot || 
                      screenshotOrders[0].paymentScreenshot || 
                      screenshotOrders[0].screenshot || 
                      (screenshotOrders[0].payment && screenshotOrders[0].payment.screenshot),
      });
    }
    
    // Track results
    const results = {
      totalOrdersChecked: allOrders.length,
      ordersWithSomeScreenshot: screenshotOrders.length,
      instapayOrders: instapayOrders.length,
      ordersFixed: 0,
      details: [] as Array<{orderId: string, changes: any}>
    };
    
    // Fix each order with a screenshot
    for (const order of screenshotOrders) {
      try {
        const updates: any = {};
        let screenshotUrl = null;
        
        // Find screenshot URL in various possible fields
        if (order.transactionScreenshot) {
          screenshotUrl = order.transactionScreenshot;
        } else if (order.paymentScreenshot) {
          screenshotUrl = order.paymentScreenshot;
          updates.transactionScreenshot = order.paymentScreenshot;
        } else if (order.screenshot) {
          screenshotUrl = order.screenshot;
          updates.transactionScreenshot = order.screenshot;
        } else if (order.payment && order.payment.screenshot) {
          screenshotUrl = order.payment.screenshot;
          updates.transactionScreenshot = order.payment.screenshot;
        }
        
        // If we found a screenshot but no payment method, set it to InstaPay
        if (screenshotUrl && (!order.paymentMethod || !isInstaPay(order.paymentMethod))) {
          updates.paymentMethod = 'InstaPay';
        }
        
        // Ensure all payment methods are consistent case (proper case 'InstaPay')
        if (isInstaPay(order.paymentMethod) && order.paymentMethod !== 'InstaPay') {
          updates.paymentMethod = 'InstaPay';
        }
        
        // Ensure paymentVerified field exists for instapay orders
        if ((updates.paymentMethod === 'InstaPay' || isInstaPay(order.paymentMethod)) && 
            order.paymentVerified === undefined) {
          updates.paymentVerified = false;
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
    
    // Fix any instapay orders without consistent case
    for (const order of instapayOrders) {
      if (order.paymentMethod !== 'InstaPay') {
        try {
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { paymentMethod: 'InstaPay' } }
          );
          
          results.ordersFixed++;
          results.details.push({
            orderId: order._id.toString(),
            changes: { paymentMethod: `${order.paymentMethod} → InstaPay` }
          });
        } catch (orderError) {
          console.error(`Error fixing InstaPay order ${order._id}:`, orderError);
        }
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      message: "Fixed all orders with screenshots",
      results,
      fixedOrders: results.details.map(detail => detail.orderId)
    });
    
  } catch (error: any) {
    console.error('Error in fixing all screenshot orders:', error);
    return NextResponse.json(
      { error: 'Failed to fix orders: ' + error.message },
      { status: 500 }
    );
  }
} 