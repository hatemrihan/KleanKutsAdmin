import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Current date info for calculating monthly data
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Initialize data structure for month-by-month data
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    let monthlyData = months.map((name, index) => ({
      name,
      sales: 0,
      month: index
    }));
    
    // Check if we have the Order model
    const Order = mongoose.models.Order;
    
    if (!Order) {
      console.log('Order model not found, trying direct database access');
      
      // Try direct collection access
      const db = mongoose.connection.db;
      
      if (db) {
        try {
          // Check orders collection directly
          const orderCollection = db.collection('orders');
          
          // Calculate total sales from all orders
          const totalSalesResult = await orderCollection.aggregate([
            { $match: { status: { $not: { $eq: 'cancelled' } } } }, // Exclude cancelled orders
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]).toArray();
          
          const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
          
          // Get monthly sales data for the current year
          // Initialize pipeline for aggregation
          const monthlyPipeline = [
            {
              $match: {
                createdAt: { 
                  $gte: new Date(currentYear, 0, 1), // Start of current year
                  $lte: new Date() // Current date
                },
                status: { $not: { $eq: 'cancelled' } } // Exclude cancelled orders
              }
            },
            {
              $group: {
                _id: { $month: '$createdAt' },
                sales: { $sum: '$totalAmount' }
              }
            },
            {
              $sort: { _id: 1 } // Sort by month
            }
          ];
          
          const monthlyResults = await orderCollection.aggregate(monthlyPipeline).toArray();
          
          // Update the monthlyData array with real data
          monthlyResults.forEach(result => {
            const monthIndex = result._id - 1; // MongoDB $month returns 1-12
            if (monthIndex >= 0 && monthIndex < 12) {
              monthlyData[monthIndex].sales = result.sales;
            }
          });
          
          // Calculate current month's sales
          const currentMonthSalesResult = await orderCollection.aggregate([
            {
              $match: {
                createdAt: { 
                  $gte: new Date(currentYear, currentMonth, 1), // Start of current month
                  $lte: new Date() // Current date
                },
                status: { $not: { $eq: 'cancelled' } } // Exclude cancelled orders
              }
            },
            {
              $group: { _id: null, total: { $sum: '$totalAmount' } }
            }
          ]).toArray();
          
          const currentMonthSales = currentMonthSalesResult.length > 0 ? currentMonthSalesResult[0].total : 0;
          
          return NextResponse.json({
            totalSales,
            currentMonthSales,
            monthlyData
          });
        } catch (error) {
          console.error('Error accessing orders collection directly:', error);
          return NextResponse.json({
            totalSales: 0,
            currentMonthSales: 0,
            monthlyData
          });
        }
      }
    } else {
      // Use the Order model
      console.log('Using Order model to calculate sales data');
      
      // Calculate total sales from all orders
      const totalSalesResult = await Order.aggregate([
        { $match: { status: { $not: { $eq: 'cancelled' } } } }, // Exclude cancelled orders
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
      
      // Get monthly sales data for the current year
      const monthlyResults = await Order.aggregate([
        {
          $match: {
            createdAt: { 
              $gte: new Date(currentYear, 0, 1), // Start of current year
              $lte: new Date() // Current date
            },
            status: { $not: { $eq: 'cancelled' } } // Exclude cancelled orders
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            sales: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { _id: 1 } // Sort by month
        }
      ]);
      
      // Update the monthlyData array with real data
      monthlyResults.forEach(result => {
        const monthIndex = result._id - 1; // MongoDB $month returns 1-12
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].sales = result.sales;
        }
      });
      
      // Calculate current month's sales
      const currentMonthSalesResult = await Order.aggregate([
        {
          $match: {
            createdAt: { 
              $gte: new Date(currentYear, currentMonth, 1), // Start of current month
              $lte: new Date() // Current date
            },
            status: { $not: { $eq: 'cancelled' } } // Exclude cancelled orders
          }
        },
        {
          $group: { _id: null, total: { $sum: '$totalAmount' } }
        }
      ]);
      
      const currentMonthSales = currentMonthSalesResult.length > 0 ? currentMonthSalesResult[0].total : 0;
      
      return NextResponse.json({
        totalSales,
        currentMonthSales,
        monthlyData
      });
    }
    
    // Fallback if none of the above methods work
    return NextResponse.json({
      totalSales: 0,
      currentMonthSales: 0,
      monthlyData
    });
  } catch (error) {
    console.error('Error calculating sales data:', error);
    return NextResponse.json({
      error: 'Failed to calculate sales data',
      totalSales: 0,
      currentMonthSales: 0,
      monthlyData: []
    }, { status: 500 });
  }
} 