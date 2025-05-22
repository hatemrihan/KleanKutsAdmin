import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { MongoClient } from 'mongodb';
import { checkProductCountsCache, markProductCountsCacheRefreshed } from '@/app/utils/cacheUtils';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Add cache-control headers to prevent caching when forcing refresh
    const headers: Record<string, string> = {};
    if (forceRefresh) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
      console.log('Force refreshing product count...');
    }
    
    // Check if we need to refresh the count based on our cache system
    const cacheStatus = await checkProductCountsCache();
    const needsRefresh = forceRefresh || cacheStatus.requiresRefresh;
    
    if (!needsRefresh) {
      console.log('Using cached product count, no refresh needed');
    }
    
    // Try multiple approaches to get the most accurate count
    let count = 0;
    let success = false;
    
    // 1. Try using Mongoose models first
    try {
      await connectToDatabase();
      const Product = mongoose.models.Product;
      
      if (Product) {
        // Count active (non-deleted) products only
        count = await Product.countDocuments({ deleted: { $ne: true } });
        console.log(`Found ${count} active products using Product model`);
        success = true;
        
        // Mark cache as refreshed if successful
        if (needsRefresh) {
          await markProductCountsCacheRefreshed();
        }
      }
    } catch (modelError) {
      console.error('Error using Mongoose model:', modelError);
    }
    
    // 2. If Mongoose approach fails, try direct MongoDB access
    if (!success) {
      try {
        // Use mongoose connection instead of clientPromise
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('products');
          
          // Count active (non-deleted) products only
          count = await collection.countDocuments({ deleted: { $ne: true } });
          console.log(`Found ${count} active products via direct collection access`);
          success = true;
          
          // Mark cache as refreshed if successful
          if (needsRefresh) {
            await markProductCountsCacheRefreshed();
          }
        }
      } catch (directError) {
        console.error('Error using direct MongoDB access:', directError);
      }
    }
    
    // Return the count with appropriate headers and cache information
    return new NextResponse(
      JSON.stringify({ 
        count, 
        timestamp: new Date().toISOString(),
        fromCache: !needsRefresh,
        cacheLastInvalidated: cacheStatus.lastInvalidated
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );
  } catch (error) {
    console.error('Error fetching product count:', error);
    
    // Return a fallback count with error information
    return NextResponse.json({ 
      count: 0, 
      error: 'Failed to fetch product count',
      errorDetails: (error as Error).message
    }, { status: 500 });
  }
} 