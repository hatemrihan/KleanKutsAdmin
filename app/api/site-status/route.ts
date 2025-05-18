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

// GET endpoint to retrieve current site status for the e-commerce site to check
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
    
    // If setting doesn't exist or site is active, return active status
    if (!siteSetting || siteSetting.value.active) {
      return NextResponse.json({
        status: 'active',
        message: siteSetting?.value?.message || 'Site is currently active'
      }, { status: 200 });
    }
    
    // If site is in maintenance mode, return inactive status
    return NextResponse.json({
      status: 'inactive',
      message: siteSetting.value.message || 'Site is under maintenance'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting site status:', error);
    // Default to active if there's an error (safer than blocking all users)
    return NextResponse.json(
      { status: 'active', message: 'Site is currently active' },
      { status: 200 }
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