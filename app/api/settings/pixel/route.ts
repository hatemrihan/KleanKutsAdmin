import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoose';
import { Settings } from '../../../models/settings';

// CORS headers to allow requests from the e-commerce site
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://elevee.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Helper to add CORS headers to all responses
const responseWithCors = (data: any, status = 200) => {
  return NextResponse.json(data, { 
    status, 
    headers: corsHeaders
  });
};

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
    
    return responseWithCors(response);
  } catch (error) {
    console.error('Error in GET /api/settings/pixel:', error);
    return responseWithCors(
      { error: 'Failed to fetch pixel settings' },
      500
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
      return responseWithCors(
        { error: 'Pixel ID is required' },
        400
      );
    }
    
    if (typeof isEnabled !== 'boolean') {
      return responseWithCors(
        { error: 'isEnabled must be a boolean' },
        400
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
    
    return responseWithCors({
      pixelId: result.value.pixelId,
      isEnabled: result.value.isEnabled
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/pixel:', error);
    return responseWithCors(
      { error: 'Failed to update pixel settings' },
      500
    );
  }
}

// POST - alias for PUT for convenience
export async function POST(req: NextRequest) {
  return PUT(req);
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No content
    headers: corsHeaders
  });
} 