import { NextResponse } from 'next/server';
import { mongooseConnect } from '../../lib/mongoose';
import { Order } from '../../models/order';
import { Product } from '../../models/product';
import { Category } from '../../models/category';

export async function GET() {
  try {
    await mongooseConnect();

    // Get total orders and sales
    const orders = await Order.find({ deleted: { $ne: true } });
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
      // Handle both totalAmount and total fields
      const orderAmount = order.totalAmount || order.total || 0;
      return sum + orderAmount;
    }, 0);

    // Get active products count
    const activeProducts = await Product.countDocuments({ deleted: { $ne: true } });

    // Get total categories count
    const totalCategories = await Category.countDocuments({ deleted: { $ne: true } });

    // Calculate current month's sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthSales = orders
      .filter(order => new Date(order.createdAt) >= startOfMonth)
      .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

    // Set monthly goal (you can adjust this value)
    const monthlyGoal = 10000; // Example: 10,000 L.E monthly goal

    // Get monthly data for the last 6 months
    const monthlyData = await Order.aggregate([
      {
        $match: {
          deleted: { $ne: true },
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { 
            $sum: { 
              $cond: [
                { $ifNull: ['$totalAmount', false] },
                '$totalAmount',
                { $ifNull: ['$total', 0] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent orders with proper customer name handling
    const recentOrders = await Order.find({ deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const formattedRecentOrders = recentOrders.map(order => ({
      _id: order._id,
      customerName: order.customer?.name || 
                   `${order.firstName || ''} ${order.lastName || ''}`.trim() || 
                   'Unknown Customer',
      status: order.status || 'pending',
      total: order.totalAmount || order.total || 0,
      createdAt: order.createdAt
    }));

    return NextResponse.json({
      totalOrders,
      totalSales,
      activeProducts,
      totalCategories,
      monthlyGoal,
      currentMonthSales,
      monthlyData,
      recentOrders: formattedRecentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 