import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { CACHE_KEYS, invalidateCache } from '@/app/utils/cacheUtils';

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
    await connectToDatabase();
    
    const data = await request.json();
    const { monthlyGoal } = data;
    
    if (typeof monthlyGoal !== 'number' || isNaN(monthlyGoal) || monthlyGoal < 0) {
      return NextResponse.json(
        { success: false, error: 'Monthly goal must be a valid positive number' },
        { status: 400 }
      );
    }
    
    console.log('Updating monthly goal to:', monthlyGoal);
    
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
    
    return NextResponse.json({
      success: true,
      monthlyGoal,
      message: 'Monthly goal updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating monthly goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update monthly goal' },
      { status: 500 }
    );
  }
} 