import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoose';
import { Settings } from '../../../models/settings';

// GET pixel settings
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find pixel settings or return defaults
    const pixelSettings = await Settings.findOne({ key: 'facebook_pixel' });
    
    // Default response if no settings found
    const response = {
      pixelId: pixelSettings?.value?.pixelId || process.env.FACEBOOK_PIXEL_ID || '',
      isEnabled: pixelSettings?.value?.isEnabled ?? false
    };
    
    console.log('Fetched pixel settings:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/settings/pixel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pixel settings' },
      { status: 500 }
    );
  }
}

// PUT/POST update pixel settings
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await req.json();
    const { pixelId, isEnabled } = data;
    
    // Validate
    if (pixelId === undefined) {
      return NextResponse.json(
        { error: 'Pixel ID is required' },
        { status: 400 }
      );
    }
    
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled must be a boolean' },
        { status: 400 }
      );
    }
    
    // Update or create settings
    const result = await Settings.findOneAndUpdate(
      { key: 'facebook_pixel' },
      { 
        key: 'facebook_pixel',
        value: { pixelId, isEnabled },
        description: 'Facebook Pixel tracking settings',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('Updated pixel settings:', result);
    
    return NextResponse.json({
      pixelId: result.value.pixelId,
      isEnabled: result.value.isEnabled
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/pixel:', error);
    return NextResponse.json(
      { error: 'Failed to update pixel settings' },
      { status: 500 }
    );
  }
}

// POST - alias for PUT for convenience
export async function POST(req: NextRequest) {
  return PUT(req);
} 