import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import { Order } from '../../../models/order';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    
    // Get timeframe from query params
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'weekly';
    const showAll = searchParams.get('showAll') === 'true'; // New parameter to show all orders
    
    // Get orders using direct MongoDB access for more control
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const ordersCollection = db.collection('orders');
    
    let query: any = {};

    if (showAll) {
      // When showing all orders, only exclude completely invalid orders
      query = {
        // Don't filter by status or deleted flag - show everything
        $or: [
          { _id: { $exists: true } }, // Just ensure it's a valid order
        ]
      };
    } else {
      // Calculate date range based on timeframe for recent period
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'daily':
          // Today only - from start of today
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          // Last 7 days
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          // Last 30 days
          startDate.setDate(now.getDate() - 30);
          break;
        case 'yearly':
          // Last 365 days
          startDate.setDate(now.getDate() - 365);
          break;
        default:
          // Default to today only
          startDate.setHours(0, 0, 0, 0);
      }

      console.log(`[ANALYTICS] Recent Period Filter - Timeframe: ${timeframe}, Start Date: ${startDate.toISOString()}, End Date: ${now.toISOString()}`);

      // Build proper query structure for recent period
      query = {
        status: { $nin: ['cancelled'] },
        deleted: { $ne: true },
        $or: [
          { 
            orderDate: { 
              $gte: startDate, 
              $lte: now 
            } 
          },
          { 
            createdAt: { 
              $gte: startDate, 
              $lte: now 
            } 
          }
        ]
      };
    }

    const orders = await ordersCollection.find(query).toArray();

    console.log(`Found ${orders.length} orders in MongoDB (showAll: ${showAll})`);
    console.log('Sample order for debugging:', orders[0]);
    
    if (showAll) {
      console.log('Order statuses in results:', orders.map(o => o.status));
    }

    // Group orders by timeframe
    const groupedOrders: { [key: string]: { amount: number; count: number } } = {};
    
    orders.forEach(order => {
      // Handle orders with missing or invalid dates
      let orderDate;
      try {
        orderDate = new Date(order.orderDate || order.createdAt || new Date());
        // If the date is invalid, use current date
        if (isNaN(orderDate.getTime())) {
          orderDate = new Date();
        }
      } catch (e) {
        orderDate = new Date();
      }
      
      let timeKey = '';
      
      switch (timeframe) {
        case 'daily':
          timeKey = orderDate.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(orderDate);
          const dayOfWeek = orderDate.getDay();
          const diff = orderDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          weekStart.setDate(diff);
          timeKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case 'monthly':
          timeKey = orderDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'yearly':
          timeKey = orderDate.getFullYear().toString();
          break;
      }
      
      if (!groupedOrders[timeKey]) {
        groupedOrders[timeKey] = { amount: 0, count: 0 };
      }
      
      // Handle both totalAmount and total fields, default to 0 if both are missing
      const orderAmount = Number(order.totalAmount || order.total || 0);
      groupedOrders[timeKey].amount += orderAmount;
      groupedOrders[timeKey].count += 1;
    });

    // Convert to array format
    const salesData = Object.keys(groupedOrders).map(date => ({
      date,
      amount: parseFloat(groupedOrders[date].amount.toFixed(2)),
      count: groupedOrders[date].count
    }));

    // Sort by date
    salesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate totals
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0);
    const totalCount = orders.length;
    const averageOrderValue = totalCount > 0 ? totalAmount / totalCount : 0;

    console.log('Processed sales data:', {
      totalOrders: totalCount,
      totalAmount: totalAmount,
      averageOrderValue: averageOrderValue,
      timeframe,
      dataPoints: salesData.length,
      showAll
    });

    return NextResponse.json({
      salesData,
      summary: {
        totalOrders: totalCount,
        totalSales: totalAmount,
        averageOrderValue: averageOrderValue
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
} 