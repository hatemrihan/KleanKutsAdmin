import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { Order } from '../../../models/order';

/**
 * Debug endpoint to directly examine orders with transaction screenshots
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    
    // Directly use MongoDB driver for more control
    const client = await clientPromise;
    const db = client.db();
    
    // Find orders with instapay and/or screenshots
    const screenshotOrders = await db.collection('orders').find({
      $or: [
        { paymentMethod: 'instapay' },
        { transactionScreenshot: { $exists: true } }
      ]
    }).toArray();
    
    // Get a count by mongoose too for comparison
    const ordersByMongoose = await Order.find({
      $or: [
        { paymentMethod: 'instapay' },
        { transactionScreenshot: { $exists: true } }
      ]
    }).lean();
    
    return NextResponse.json({
      success: true,
      message: "Found orders with screenshots",
      countDirect: screenshotOrders.length,
      countMongoose: ordersByMongoose.length,
      orders: screenshotOrders.map(order => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        transactionScreenshot: order.transactionScreenshot,
        orderDate: order.orderDate,
        customerName: order.customer?.name || 'Unknown Customer'
      }))
    });
    
  } catch (error: any) {
    console.error('Error in debugging orders:', error);
    return NextResponse.json(
      { error: 'Failed to debug orders: ' + error.message },
      { status: 500 }
    );
  }
} 