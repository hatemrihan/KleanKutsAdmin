import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { mongooseConnect } from '@/app/lib/mongoose';

export async function GET() {
  try {
    console.log('Real-sales API called, connecting to database...');
    
    // Try both connection methods to ensure we connect
    try {
      await connectToDatabase();
      console.log('Connected via connectToDatabase');
    } catch (connErr) {
      console.error('Error with connectToDatabase:', connErr);
      try {
        await mongooseConnect();
        console.log('Connected via mongooseConnect');
      } catch (connErr2) {
        console.error('Error with mongooseConnect:', connErr2);
        console.log('Connection state:', mongoose.connection.readyState);
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
    
    // Check if we have the Order model
    const Order = mongoose.models.Order;
    
    if (!Order) {
      console.log('Order model not found, trying direct database access');
      
      // Try direct collection access
      const db = mongoose.connection.db;
      
      if (db) {
        try {
          // List all collections for debugging
          const collections = await db.listCollections().toArray();
          console.log('Available collections:', collections.map(c => c.name));
          
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
                  $lte: new Date() // Current date
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
          
          console.log('Returning real sales data');
          return NextResponse.json({
            totalSales,
            currentMonthSales,
            monthlyData
          });
        } catch (error) {
          console.error('Error accessing orders collection directly:', error);
          // Fall back to returning the initialized default data
          return NextResponse.json({
            totalSales: 0,
            currentMonthSales: 0,
            monthlyData,
            error: 'Failed to access orders collection directly'
          });
        }
      } else {
        console.error('Database connection not available');
        return NextResponse.json({
          totalSales: 0,
          currentMonthSales: 0,
          monthlyData,
          error: 'Database connection not available'
        });
      }
    } else {
      // Use the Order model
      console.log('Using Order model to calculate sales data');
      
      try {
        // Get total orders count
        const orderCount = await Order.countDocuments({});
        console.log(`Found ${orderCount} orders with Order model`);
        
        // Calculate total sales from all orders
        const totalSalesResult = await Order.aggregate([
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
        ]);
        
        totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
        console.log('Total sales calculated with Order model:', totalSales);
        
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
        ]);
        
        console.log('Monthly results with Order model:', monthlyResults);
        
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
        ]);
        
        currentMonthSales = currentMonthSalesResult.length > 0 ? currentMonthSalesResult[0].total : 0;
        console.log('Current month sales (Order model):', currentMonthSales);
        
        // Return the data
        console.log('Returning real sales data from Order model');
        return NextResponse.json({
          totalSales,
          currentMonthSales,
          monthlyData
        });
      } catch (modelError) {
        console.error('Error using Order model:', modelError);
        return NextResponse.json({
          totalSales: 0,
          currentMonthSales: 0,
          monthlyData,
          error: 'Error using Order model'
        });
      }
    }
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