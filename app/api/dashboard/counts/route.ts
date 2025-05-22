import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { mongooseConnect } from '@/app/lib/mongoose';

export async function GET() {
  try {
    console.log('Counts API called, connecting to database...');
    
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
    
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Available models:', Object.keys(mongoose.models));
    
    let productCount = 0;
    let categoryCount = 0;
    
    // Try using models first
    try {
      if (mongoose.models.Product) {
        productCount = await mongoose.models.Product.countDocuments({});
        console.log('Product count from model:', productCount);
      }
      
      if (mongoose.models.Category) {
        categoryCount = await mongoose.models.Category.countDocuments({});
        console.log('Category count from model:', categoryCount);
      }
    } catch (modelError) {
      console.error('Error using models for counts:', modelError);
    }
    
    // If models didn't work, try direct collection access
    if (productCount === 0 || categoryCount === 0) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          // List all collections for debugging
          const collections = await db.listCollections().toArray();
          console.log('Available collections:', collections.map(c => c.name));
          
          if (productCount === 0) {
            try {
              productCount = await db.collection('products').countDocuments({});
              console.log('Product count from direct access:', productCount);
            } catch (err) {
              console.error('Error counting products directly:', err);
            }
          }
          
          if (categoryCount === 0) {
            try {
              categoryCount = await db.collection('categories').countDocuments({});
              console.log('Category count from direct access:', categoryCount);
            } catch (err) {
              console.error('Error counting categories directly:', err);
            }
          }
        } else {
          console.error('Database connection not available for direct access');
        }
      } catch (directError) {
        console.error('Error with direct collection access:', directError);
      }
    }
    
    return NextResponse.json({
      productCount,
      categoryCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in counts API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch counts',
        message: error instanceof Error ? error.message : 'Unknown error',
        productCount: 0,
        categoryCount: 0
      },
      { status: 500 }
    );
  }
} 