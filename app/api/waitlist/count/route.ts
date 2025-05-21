import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Try to get the Waitlist model
    const Waitlist = mongoose.models.Waitlist;
    
    if (!Waitlist) {
      console.error('Waitlist model not found - trying direct collection access');
      // If the model doesn't exist, try to access the collection directly
      const db = mongoose.connection.db;
      if (db) {
        try {
          // Try different collection names that might contain waitlist data
          const collections = ['waitlists', 'waitlist', 'subscribers'];
          
          for (const collName of collections) {
            try {
              const collection = db.collection(collName);
              // Skip if collection doesn't exist
              if (!collection) continue;
              
              const count = await collection.countDocuments({});
              console.log(`Found ${count} waitlist subscribers in ${collName} collection`);
              if (count > 0) {
                return NextResponse.json({ count, success: true });
              }
            } catch (err) {
              console.error(`Error checking ${collName} collection:`, err);
            }
          }
        } catch (collectionError) {
          console.error('Error accessing collections directly:', collectionError);
        }
      }
      
      // If we reached here, we couldn't find any waitlist data
      console.warn('Could not find waitlist data in any known collection');
      return NextResponse.json({ count: 0, success: false });
    }
    
    // If we have the Waitlist model, use it
    const count = await Waitlist.countDocuments({});
    console.log(`Found ${count} waitlist subscribers using Waitlist model`);
    
    return NextResponse.json({ count, success: true });
  } catch (error) {
    console.error('Error fetching waitlist count:', error);
    
    // Fallback to direct database access if model fails
    try {
      const db = mongoose.connection.db;
      if (db) {
        // Try different collection names
        const collections = ['waitlists', 'waitlist', 'subscribers'];
        
        for (const collName of collections) {
          try {
            const collection = db.collection(collName);
            if (!collection) continue;
            
            const count = await collection.countDocuments({});
            console.log(`Fallback: Found ${count} waitlist subscribers in ${collName}`);
            if (count > 0) {
              return NextResponse.json({ count, success: true });
            }
          } catch (err) {
            // Continue to next collection on error
          }
        }
      }
    } catch (fallbackError) {
      console.error('Fallback approach also failed:', fallbackError);
    }
    
    return NextResponse.json({ count: 0, success: false });
  }
} 