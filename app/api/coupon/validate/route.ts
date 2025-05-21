import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// POST /api/coupon/validate - Validate a coupon code and get its discount percentage
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }
    
    // Normalize code to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    
    // Try to find an ambassador with this coupon code (case-insensitive)
    // IMPORTANT: Now also check that isActive is true
    let ambassador = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true },
        { referralCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true }
      ]
    });
    
    // If not found, inactive, or not approved, return invalid
    if (!ambassador) {
      console.log(`Invalid coupon code attempted: ${normalizedCode}`);
      const response = NextResponse.json(
        { valid: false, message: 'Invalid or expired coupon code' },
        { status: 200 }
      );
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    console.log(`Valid coupon code used: ${normalizedCode}, ambassador: ${ambassador.name}`);
    
    // Return validation result with discount information
    const response = NextResponse.json({
      valid: true,
      discount: {
        type: 'percentage',
        value: ambassador.discountPercent,
        ambassadorId: ambassador._id
      },
      message: `Coupon code applied: ${ambassador.discountPercent}% discount`
    }, { status: 200 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
} 