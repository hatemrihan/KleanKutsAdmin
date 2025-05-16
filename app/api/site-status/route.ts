import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Setting } from '@/app/models/setting';

// Configure CORS headers for the e-commerce site
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins during development
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// GET endpoint to retrieve current site status for the e-commerce site
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Get the site status setting
    const siteSetting = await Setting.findOne({ key: 'site_status' });
    
    // If setting doesn't exist, assume site is active
    if (!siteSetting) {
      console.log('[API] No site_status found, returning default active status');
      return NextResponse.json({
        active: true,
        message: 'Site is currently active',
      }, { status: 200, headers: corsHeaders });
    }
    
    console.log('[API] Returning site status:', siteSetting.value);
    return NextResponse.json(siteSetting.value, { 
      status: 200, 
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('[API] Error getting site status:', error);
    // Default to active if there's an error, to prevent blocking the site unnecessarily
    return NextResponse.json(
      { 
        active: true,
        message: 'Site is active (error checking status)',
      },
      { status: 200, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  console.log('[API] Handling OPTIONS request for site-status');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
} 