import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get the Category model
    const Category = mongoose.models.Category;
    
    if (!Category) {
      console.error('Category model not found - trying direct collection access');
      // If the model doesn't exist, try to access the collection directly
      const db = mongoose.connection.db;
      if (db) {
        try {
          // Try direct collection access as fallback
          const collection = db.collection('categories');
          const count = await collection.countDocuments({});
          console.log(`Found ${count} categories via direct collection access`);
          return NextResponse.json({ count });
        } catch (collectionError) {
          console.error('Error accessing categories collection directly:', collectionError);
        }
      }
      return NextResponse.json({ count: 0 });
    }
    
    // Count all categories
    const count = await Category.countDocuments({});
    console.log(`Found ${count} categories using Category model`);
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching category count:', error);
    
    // Fallback direct MongoDB query if model approach failed
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collection = db.collection('categories');
        const count = await collection.countDocuments({});
        console.log(`Fallback: Found ${count} categories via direct collection`);
        return NextResponse.json({ count });
      }
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
    }
    
    return NextResponse.json({ count: 0 });
  }
} 