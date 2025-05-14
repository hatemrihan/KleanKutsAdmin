import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// POST /api/coupon/redeem - Track when a coupon is used in a purchase
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { 
      code,
      orderId,
      orderAmount,
      customerEmail,
      products = []
    } = await request.json();
    
    if (!code || !orderId || !orderAmount) {
      const response = NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    // Normalize code to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    
    // Try to find an ambassador with this coupon code (case-insensitive)
    let ambassador = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved' },
        { referralCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved' }
      ]
    });
    
    // If not found or not approved, return error
    if (!ambassador) {
      const response = NextResponse.json(
        { error: 'Invalid ambassador code' },
        { status: 400 }
      );
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    // Calculate commission
    const commission = orderAmount * ambassador.commissionRate;
    
    // Update ambassador stats
    const updateResult = await Ambassador.findByIdAndUpdate(
      ambassador._id,
      {
        $inc: {
          sales: orderAmount,
          earnings: commission,
          orders: 1,
          paymentsPending: commission
        },
        $push: {
          recentOrders: {
            orderId,
            orderDate: new Date(),
            amount: orderAmount,
            commission,
            isPaid: false
          }
        }
      },
      { new: true }
    );
    
    const response = NextResponse.json({
      success: true,
      ambassadorId: ambassador._id,
      commission,
      message: 'Coupon redemption recorded successfully'
    }, { status: 200 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    const response = NextResponse.json(
      { error: 'Failed to redeem coupon' },
      { status: 500 }
    );
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
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