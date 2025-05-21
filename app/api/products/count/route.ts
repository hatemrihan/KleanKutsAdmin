import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get the Product model
    const Product = mongoose.models.Product;
    
    if (!Product) {
      console.error('Product model not found - trying to create from schema');
      // If the model doesn't exist, try to create it or use a direct collection approach
      const db = mongoose.connection.db;
      if (db) {
        try {
          // Try direct collection access as fallback
          const collection = db.collection('products');
          const count = await collection.countDocuments({});
          console.log(`Found ${count} products via direct collection access`);
          return NextResponse.json({ count });
        } catch (collectionError) {
          console.error('Error accessing products collection directly:', collectionError);
        }
      }
      return NextResponse.json({ count: 0 });
    }
    
    // Count all products (remove active filter to get all)
    const count = await Product.countDocuments({});
    console.log(`Found ${count} products using Product model`);
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching product count:', error);
    
    // Fallback direct MongoDB query if model approach failed
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collection = db.collection('products');
        const count = await collection.countDocuments({});
        console.log(`Fallback: Found ${count} products via direct collection`);
        return NextResponse.json({ count });
      }
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
    }
    
    return NextResponse.json({ count: 0 });
  }
} 