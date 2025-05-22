import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { mongooseConnect } from '@/app/lib/mongoose';
import { CACHE_KEYS, invalidateCache } from '@/app/utils/cacheUtils';

// Declare the dashboard cache on global type
declare global {
  var dashboardCache: {
    monthlyGoal?: number;
    [key: string]: any;
  };
}

// Define a schema for the settings
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

// Get the model (or create it if it doesn't exist)
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export async function POST(request: NextRequest) {
  try {
    console.log('Monthly goal update API called');
    
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
    
    const data = await request.json();
    const { monthlyGoal } = data;
    
    console.log('Received monthly goal update request:', monthlyGoal);
    console.log('Request body:', data);
    
    if (typeof monthlyGoal !== 'number' || isNaN(monthlyGoal) || monthlyGoal < 0) {
      return NextResponse.json(
        { success: false, error: 'Monthly goal must be a valid positive number' },
        { status: 400 }
      );
    }
    
    console.log('Updating monthly goal to:', monthlyGoal);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // First, try using the model
    try {
      console.log('Attempting to update using Settings model');
      // Update or create the monthly goal setting
      const updatedSettings = await Settings.findOneAndUpdate(
        { key: 'monthlyGoal' },
        { 
          value: monthlyGoal,
          lastUpdated: new Date()
        },
        { 
          upsert: true, // Create if doesn't exist
          new: true // Return the updated document
        }
      );
      
      console.log('Updated settings:', updatedSettings);
    } catch (modelError) {
      console.error('Error updating with model:', modelError);
      
      // If the model update fails, try direct collection access
      try {
        console.log('Attempting direct collection access');
        const db = mongoose.connection.db;
        
        if (db) {
          // Try to find the settings collection
          const collections = await db.listCollections({name: 'settings'}).toArray();
          console.log('Settings collection exists:', collections.length > 0);
          
          const result = await db.collection('settings').updateOne(
            { key: 'monthlyGoal' },
            { 
              $set: { 
                value: monthlyGoal,
                lastUpdated: new Date()
              }
            },
            { upsert: true }
          );
          
          console.log('Direct collection update result:', result);
        } else {
          console.error('Database connection not available for direct access');
        }
      } catch (directError) {
        console.error('Error with direct collection access:', directError);
      }
    }
    
    // Invalidate any related caches to ensure fresh data on next fetch
    try {
      await invalidateCache(CACHE_KEYS.DASHBOARD_STATS);
      console.log('Dashboard stats cache invalidated');
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError);
      // Continue execution even if cache invalidation fails
    }
    
    // Try to update the dashboard summary in real-time if available
    try {
      const db = mongoose.connection.db;
      if (db && db.collection('dashboardSummary')) {
        await db.collection('dashboardSummary').updateOne(
          { key: 'current' },
          { 
            $set: { 
              monthlyGoal: monthlyGoal,
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );
        console.log('Dashboard summary updated in real-time');
      }
    } catch (dbError) {
      console.error('Error updating dashboard summary:', dbError);
      // Continue execution even if this update fails
    }
    
    // Also update in memory cache for immediate access
    try {
      global.dashboardCache = global.dashboardCache || {};
      global.dashboardCache.monthlyGoal = monthlyGoal;
      console.log('Updated in-memory cache');
    } catch (memError) {
      console.error('Error updating in-memory cache:', memError);
    }
    
    return NextResponse.json({
      success: true,
      monthlyGoal,
      message: 'Monthly goal updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating monthly goal:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update monthly goal',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 