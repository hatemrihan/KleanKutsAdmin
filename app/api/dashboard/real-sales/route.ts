import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { mongooseConnect } from '@/app/lib/mongoose';

export async function GET() {
  try {
    console.log('Real-sales API called, connecting to database...');
    
    // Try multiple connection methods to ensure we connect
    let connectionSuccess = false;
    
    try {
      await connectToDatabase();
      console.log('Connected via connectToDatabase');
      connectionSuccess = true;
    } catch (connErr) {
      console.error('Error with connectToDatabase:', connErr);
      try {
        await mongooseConnect();
        console.log('Connected via mongooseConnect');
        connectionSuccess = true;
      } catch (connErr2) {
        console.error('Error with mongooseConnect:', connErr2);
        console.log('Connection state:', mongoose.connection.readyState);
      }
    }
    
    if (!connectionSuccess) {
      // One more attempt with direct connection
      try {
        console.log('Attempting direct connection to MongoDB');
        const uri = process.env.MONGODB_URI || 
                   process.env.NEXT_PUBLIC_MONGODB_URI || 
                   process.env.DATABASE_URL ||
                   'mongodb+srv://seif:seif123@seif.pulbpsi.mongodb.net/?retryWrites=true&w=majority';
                   
        await mongoose.connect(uri);
        console.log('Connected via direct connection');
        connectionSuccess = true;
      } catch (directConnErr) {
        console.error('All connection attempts failed:', directConnErr);
      }
    }
    
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
    
    let totalSales = 0;
    let currentMonthSales = 0;
    
    console.log('Calculating real sales data...');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Available models:', Object.keys(mongoose.models));
    
    // Log available collections to debug
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
      } else {
        console.log('Database connection not fully established yet');
      }
    } catch (err) {
      console.error('Error listing collections:', err);
    }
    
    try {
      const db = mongoose.connection.db;
      if (db) {
        // Check orders collection directly
        const orderCollection = db.collection('orders');
        const orderCount = await orderCollection.countDocuments({});
        console.log(`Found ${orderCount} orders in collection`);
        
        // Calculate total sales from all orders
        const totalSalesResult = await orderCollection.aggregate([
          { $match: { status: { $not: { $eq: 'cancelled' } } } }, // Exclude cancelled orders
          { 
            $group: { 
              _id: null, 
              total: { 
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
        
        totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
        console.log('Total sales calculated:', totalSales);
        
        // Get monthly sales data for the current year
        // Initialize pipeline for aggregation
        const monthlyPipeline = [
          {
            $match: {
              createdAt: { 
                $gte: new Date(currentYear, 0, 1), // Start of current year
                $lte: new Date(currentYear, 11, 31, 23, 59, 59) // End of current year
              },
              status: { $not: { $eq: 'cancelled' } } // Exclude cancelled orders
            }
          },
          {
            $group: {
              _id: { $month: '$createdAt' },
              sales: { 
                $sum: { 
                  $cond: [
                    { $ifNull: ["$totalAmount", false] },
                    "$totalAmount",
                    { $ifNull: ["$total", 0] }
                  ]
                } 
              }
            }
          },
          {
            $sort: { _id: 1 } // Sort by month
          }
        ];
        
        const monthlyResults = await orderCollection.aggregate(monthlyPipeline).toArray();
        console.log('Monthly results:', monthlyResults);
        
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
            $group: { 
              _id: null, 
              total: { 
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
        
        currentMonthSales = currentMonthSalesResult.length > 0 ? currentMonthSalesResult[0].total : 0;
        console.log('Current month sales:', currentMonthSales);
        
        // Sort monthly data to ensure it's in the right order
        monthlyData.sort((a, b) => a.month - b.month);
      } else {
        console.error('Database connection not available');
        return NextResponse.json({
          totalSales: 0,
          currentMonthSales: 0,
          monthlyData,
          error: 'Database connection not available'
        });
      }
    } catch (error) {
      console.error('Error calculating sales data:', error);
      return NextResponse.json({
        totalSales: 0,
        currentMonthSales: 0,
        monthlyData,
        error: 'Failed to calculate sales data'
      });
    }
    
    console.log('Returning real sales data:', {
      totalSales,
      currentMonthSales,
      monthlyDataSample: monthlyData.slice(0, 3) // Log just a sample to avoid cluttering logs
    });
    
    return NextResponse.json({
      totalSales,
      currentMonthSales,
      monthlyData
    });
  } catch (error) {
    console.error('Error in real-sales API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate sales data',
        message: error instanceof Error ? error.message : 'Unknown error',
        totalSales: 0,
        currentMonthSales: 0,
        monthlyData: []
      },
      { status: 500 }
    );
  }
} 