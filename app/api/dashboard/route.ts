import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
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
    await connectToDatabase();
    
    console.log('Fetching dashboard data...');
    
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
        
        // Sum all total amounts
        const salesResult = await Order.aggregate([
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        
        // Get current month sales
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const currentMonthResult = await Order.aggregate([
          { 
            $match: { 
              createdAt: { $gte: startOfMonth } 
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$totalAmount' } 
            } 
          }
        ]);
        
        currentMonthSales = currentMonthResult.length > 0 ? currentMonthResult[0].total : 0;
        
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
    }
    
    // Fetch products count
    const Product = mongoose.models.Product;
    let activeProducts = 0;
    
    if (Product) {
      try {
        activeProducts = await Product.countDocuments({});
      } catch (err) {
        console.error('Error fetching product data:', err);
        // Continue with default value
      }
    } else {
      // Try direct collection access
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('products');
          activeProducts = await collection.countDocuments({});
          console.log(`Direct access: Found ${activeProducts} products`);
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
      } catch (err) {
        console.error('Error fetching category data:', err);
        // Continue with default value
      }
    } else {
      // Try direct collection access
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('categories');
          totalCategories = await collection.countDocuments({});
          console.log(`Direct access: Found ${totalCategories} categories`);
        }
      } catch (err) {
        console.error('Error with direct category collection access:', err);
      }
    }
    
    // Generate monthly data for the chart (last 12 months)
    const monthlyData = generateMonthlyData();
    
    return NextResponse.json({
      totalOrders,
      totalSales,
      activeProducts,
      totalCategories,
      monthlyGoal,
      currentMonthSales,
      recentOrders,
      monthlyData
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to generate monthly data for the chart
function generateMonthlyData() {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const currentMonth = new Date().getMonth();
  const data = [];
  
  // Generate data for the last 12 months
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12; // Go back 11 months and loop forward
    
    // Generate some random but realistic looking data
    // Making more recent months have higher values, with some randomness
    const progress = i / 11; // 0 to 1
    const base = 10000 + (50000 * progress);
    const randomFactor = 0.5 + (Math.random() * 1.0); // Random between 0.5 and 1.5
    const sales = Math.round(base * randomFactor);
    
    data.push({
      name: months[monthIndex],
      sales
    });
  }
  
  return data;
} 