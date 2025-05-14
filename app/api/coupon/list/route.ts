import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// GET /api/coupon/list - Get all active coupon codes
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Find all approved ambassadors
    const ambassadors = await Ambassador.find(
      { status: 'approved' },
      'name couponCode referralCode discountPercent'
    );
    
    // Format the response to include both coupon and referral codes
    const coupons = ambassadors.flatMap(ambassador => {
      const codes = [];
      
      // Add custom coupon code if it exists
      if (ambassador.couponCode) {
        codes.push({
          code: ambassador.couponCode,
          type: 'coupon',
          discountPercent: ambassador.discountPercent,
          ambassadorName: ambassador.name,
          ambassadorId: ambassador._id
        });
      }
      
      // Add referral code
      if (ambassador.referralCode) {
        codes.push({
          code: ambassador.referralCode,
          type: 'referral',
          discountPercent: ambassador.discountPercent,
          ambassadorName: ambassador.name,
          ambassadorId: ambassador._id
        });
      }
      
      return codes;
    });
    
    // Create response with CORS headers
    const response = NextResponse.json({ 
      status: "success",
      count: coupons.length,
      coupons 
    }, { status: 200 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching coupon list:', error);
    return NextResponse.json(
      { status: "error", error: 'Failed to fetch coupon codes' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
} 