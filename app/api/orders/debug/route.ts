import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import mongoose from 'mongoose';

/**
 * Debug endpoint to directly examine all orders in the database
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get all orders from MongoDB directly
    const ordersCollection = db.collection('orders');
    
    // Count total orders
    const totalOrders = await ordersCollection.countDocuments({});
    
    // Count non-cancelled orders
    const activeOrders = await ordersCollection.countDocuments({
      status: { $nin: ['cancelled'] }
    });
    
    // Count by status
    const ordersByStatus = await ordersCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Calculate total sales
    const salesResult = await ordersCollection.aggregate([
      {
        $match: { status: { $nin: ['cancelled'] } }
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $cond: [
                { $ifNull: ["$totalAmount", false] },
                "$totalAmount",
                { $ifNull: ["$total", 0] }
              ]
            }
          }
        }
      }
    ]).toArray();

    const totalSales = salesResult.length > 0 ? salesResult[0].totalAmount : 0;

    // Get all orders with key details
    const allOrders = await ordersCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    const orderDetails = allOrders.map(order => ({
      _id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      total: order.total,
      customer: order.customer,
      customerName: order.customer?.name || `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Unknown',
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      hasTransactionScreenshot: !!order.transactionScreenshot,
      transactionScreenshot: order.transactionScreenshot
    }));

    // Group orders by date to see distribution
    const ordersByDate: Record<string, number> = {};
    allOrders.forEach(order => {
      const date = new Date(order.orderDate || order.createdAt).toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = 0;
      }
      ordersByDate[date]++;
    });

    return NextResponse.json({
      summary: {
        totalOrderCount: totalOrders,
        activeOrderCount: activeOrders,
        totalSales: totalSales,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
      },
      ordersByStatus,
      ordersByDate,
      databaseInfo: {
        databaseName: db.databaseName,
        collectionName: 'orders'
      },
      allOrders: orderDetails
    });
  } catch (error: any) {
    console.error('Error debugging orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug orders' },
      { status: 500 }
    );
  }
} 