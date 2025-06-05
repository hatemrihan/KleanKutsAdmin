import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Setting } from '@/app/models/setting';
import { responseWithCors, handleCorsOptions } from '../../../lib/cors';

// GET endpoint to retrieve current site status for the e-commerce site to check
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
    
    // If setting doesn't exist or site is active, return active status
    if (!siteSetting || siteSetting.value.active) {
      return responseWithCors({
        status: 'active',
        message: siteSetting?.value?.message || 'Site is currently active'
      }, 200, request);
    }
    
    // If site is in maintenance mode, return inactive status
    return responseWithCors({
      status: 'inactive',
      message: siteSetting.value.message || 'Site is under maintenance'
    }, 200, request);
    
  } catch (error) {
    console.error('Error getting site status:', error);
    // Default to active if there's an error (safer than blocking all users)
    return responseWithCors(
      { status: 'active', message: 'Site is currently active' },
      200,
      request
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log('[API] Handling OPTIONS request for site-status');
  return handleCorsOptions(request);
} 