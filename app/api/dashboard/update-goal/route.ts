import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

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
    
    return NextResponse.json({
      success: true,
      monthlyGoal,
      message: 'Monthly goal updated successfully'
    });
  } catch (error) {
    console.error('Error updating monthly goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update monthly goal' },
      { status: 500 }
    );
  }
} 