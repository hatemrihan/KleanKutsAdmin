import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Setting } from '@/app/models/setting';

// GET endpoint to retrieve current site status
export async function GET() {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Get the site status setting
    const siteSetting = await Setting.findOne({ key: 'site_status' });
    
    // If setting doesn't exist, create it with default value (active)
    if (!siteSetting) {
      const newSetting = new Setting({
        key: 'site_status',
        value: {
          active: true,
          message: 'Site is currently active',
        },
        description: 'Controls whether the e-commerce site is active or in maintenance mode'
      });
      
      await newSetting.save();
      
      return NextResponse.json({
        status: 'success',
        data: {
          active: true,
          message: 'Site is currently active',
        }
      }, { status: 200 });
    }
    
    return NextResponse.json({
      status: 'success',
      data: siteSetting.value
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting site status:', error);
    return NextResponse.json(
      { error: 'Failed to get site status' },
      { status: 500 }
    );
  }
}

// POST endpoint to update site status
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Parse request body
    const { active, message, updatedBy } = await request.json();
    
    if (active === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: active' },
        { status: 400 }
      );
    }
    
    // Get existing setting or create new one
    let siteSetting = await Setting.findOne({ key: 'site_status' });
    
    if (!siteSetting) {
      siteSetting = new Setting({
        key: 'site_status',
        value: {
          active: active,
          message: message || (active ? 'Site is currently active' : 'Site is under maintenance'),
        },
        description: 'Controls whether the e-commerce site is active or in maintenance mode'
      });
    } else {
      // Update existing setting
      siteSetting.value = {
        active: active,
        message: message || siteSetting.value.message || (active ? 'Site is currently active' : 'Site is under maintenance'),
      };
    }
    
    // Set updated by if provided
    if (updatedBy) {
      siteSetting.updatedBy = updatedBy;
    }
    
    await siteSetting.save();
    
    return NextResponse.json({
      status: 'success',
      message: `Site is now ${active ? 'active' : 'in maintenance mode'}`,
      data: siteSetting.value
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating site status:', error);
    return NextResponse.json(
      { error: 'Failed to update site status' },
      { status: 500 }
    );
  }
} 