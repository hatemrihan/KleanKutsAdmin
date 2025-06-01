import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { mongooseConnect } from '@/app/lib/mongoose';
import { Order } from '../../models/order';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { Setting } from '../../models/setting';

// Get the Settings model
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// Define interface for recent orders
interface RecentOrder {
  _id: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    // Try both connection methods to ensure database connectivity
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
      }
    }
    
    console.log('Fetching dashboard data...');
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
    
    // Fetch monthly goal
    const monthlyGoalSetting = await Settings.findOne({ key: 'monthlyGoal' });
    const monthlyGoal = monthlyGoalSetting ? Number(monthlyGoalSetting.value) : 100000;
    
    // Fetch orders count and total sales
    const Order = mongoose.models.Order;
    
    // Default values for when real data isn't available yet
    let totalOrders = 0;
    let totalSales = 0;
    let recentOrders: RecentOrder[] = [];
    let currentMonthSales = 0;
    
    if (Order) {
      try {
        totalOrders = await Order.countDocuments({});
        console.log('Found orders count:', totalOrders);
        
        // Sum all total amounts
        const salesResult = await Order.aggregate([
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        console.log('Total sales from Order model:', totalSales);
        
        // Get current month sales - improved to handle different order status types
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const currentMonthResult = await Order.aggregate([
          { 
            $match: { 
              createdAt: { $gte: startOfMonth },
              // Don't count cancelled orders in monthly sales
              status: { $ne: 'cancelled' }
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
        
        currentMonthSales = currentMonthResult.length > 0 ? currentMonthResult[0].total : 0;
        console.log('Current month sales:', currentMonthSales);
        
        // Get recent orders
        recentOrders = await Order.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then(orders => orders.map(order => {
            const orderAny = order as any; // Type cast to any to avoid TypeScript errors
            return {
              _id: orderAny._id.toString(),
              customerName: orderAny.customer?.name || 'Unknown Customer',
              status: orderAny.status || 'pending',
              total: orderAny.totalAmount || 0,
              createdAt: orderAny.createdAt ? orderAny.createdAt.toISOString() : new Date().toISOString()
            };
          }));
      } catch (err) {
        console.error('Error fetching order data:', err);
        // Continue with default values
      }
    } else {
      // Try direct collection access if model approach fails
      try {
        const db = mongoose.connection.db;
        if (db) {
          const orderCollection = db.collection('orders');
          totalOrders = await orderCollection.countDocuments({});
          console.log('Found orders using direct collection access:', totalOrders);
          
          // Sum all total amounts
          const salesResult = await orderCollection.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]).toArray();
          
          totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
          console.log('Total sales from direct collection:', totalSales);
          
          // Get current month sales - improved to handle different order status types
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const currentMonthResult = await orderCollection.aggregate([
            { 
              $match: { 
                createdAt: { $gte: startOfMonth },
                // Don't count cancelled orders in monthly sales
                status: { $ne: 'cancelled' }
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
          
          currentMonthSales = currentMonthResult.length > 0 ? currentMonthResult[0].total : 0;
          console.log('Current month sales from direct collection:', currentMonthSales);
          
          // Get recent orders
          const recentOrdersRaw = await orderCollection.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
            
          recentOrders = recentOrdersRaw.map(order => ({
            _id: order._id.toString(),
            customerName: order.customer?.name || 'Unknown Customer',
            status: order.status || 'pending',
            total: order.totalAmount || 0,
            createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString()
          }));
        }
      } catch (directErr) {
        console.error('Error with direct order collection access:', directErr);
      }
    }
    
    // Fetch products count
    const Product = mongoose.models.Product;
    let activeProducts = 0;
    
    if (Product) {
      try {
        activeProducts = await Product.countDocuments({});
        console.log('Product count from model:', activeProducts);
      } catch (err) {
        console.error('Error fetching product data:', err);
      }
    }
    
    // Try direct collection access for products if model approach fails
    if (activeProducts === 0) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('products');
          activeProducts = await collection.countDocuments({});
          console.log('Product count from direct access:', activeProducts);
        }
      } catch (err) {
        console.error('Error with direct product collection access:', err);
      }
    }
    
    // Fetch categories count
    const Category = mongoose.models.Category;
    let totalCategories = 0;
    
    if (Category) {
      try {
        totalCategories = await Category.countDocuments({});
        console.log('Category count from model:', totalCategories);
      } catch (err) {
        console.error('Error fetching category data:', err);
      }
    }
    
    // Try direct collection access for categories if model approach fails
    if (totalCategories === 0) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('categories');
          totalCategories = await collection.countDocuments({});
          console.log('Category count from direct access:', totalCategories);
        }
      } catch (err) {
        console.error('Error with direct category collection access:', err);
      }
    }
    
    // Generate monthly data for the chart (last 12 months)
    const monthlyData = await generateRealMonthlyData();
    
    console.log('Responding with dashboard data:', {
      totalOrders,
      totalSales,
      activeProducts,
      totalCategories,
      currentMonthSales
    });

    // Log summary of dashboard data before responding
    console.log('Dashboard data summary:', {
      totalOrders,
      totalSales,
      activeProducts,
      totalCategories,
      monthlyGoal,
      currentMonthSales,
      recentOrdersCount: recentOrders.length,
      monthlyDataPoints: monthlyData.length
    });
    
    return NextResponse.json({
      totalOrders,
      totalSales,
      activeProducts,
      totalCategories,
      monthlyGoal,
      currentMonthSales,
      recentOrders,
      monthlyData
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to generate monthly data for the chart based on real order data
async function generateRealMonthlyData() {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Initialize data with zeroes for all months
    const monthlyData = months.map((name, index) => ({
      name,
      sales: 0,
      month: index
    }));
    
    // Try to get real data from orders collection
    try {
      const db = mongoose.connection.db;
      if (db) {
        const orderCollection = db.collection('orders');
        
        // Get monthly sales for the current year
        const monthlyResults = await orderCollection.aggregate([
          {
            $match: {
              createdAt: { 
                $gte: new Date(currentYear, 0, 1),
                $lte: new Date(currentYear, 11, 31, 23, 59, 59)
              },
              status: { $not: { $eq: 'cancelled' } }
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
            $sort: { _id: 1 }
          }
        ]).toArray();
        
        console.log('Monthly sales data:', monthlyResults);
        
        // Update the monthlyData array with real data
        monthlyResults.forEach(result => {
          const monthIndex = result._id - 1; // MongoDB $month returns 1-12
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyData[monthIndex].sales = result.sales;
          }
        });
      }
    } catch (err) {
      console.error('Error getting real monthly data:', err);
    }
    
    return monthlyData;
  } catch (error) {
    console.error('Error generating monthly data:', error);
    
    // Return a default dataset if we can't get real data
    return months.map(name => ({
      name,
      sales: 0
    }));
  }
} 