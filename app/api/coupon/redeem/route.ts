import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { responseWithCors, handleCorsOptions } from '../../../../lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log('[COUPON REDEEM API] OPTIONS preflight request received');
  return handleCorsOptions(request);
}

// POST /api/coupon/redeem - Track when a coupon is used in a purchase
export async function POST(request: NextRequest) {
  try {
    console.log('[COUPON REDEEM API] Processing redemption request from origin:', request.headers.get('origin'));
    
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
    
    console.log('[COUPON REDEEM API] Request data:', { code, orderId, orderAmount, customerEmail });
    
    if (!code || !orderId || !orderAmount) {
      console.log('[COUPON REDEEM API] Missing required fields');
      return responseWithCors({ error: 'Required fields missing' }, 400, request);
    }
    
    // Normalize code to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    
    // Try to find an ambassador with this coupon code (case-insensitive)
    // Also check that ambassador is active (isActive: true)
    let ambassador = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true },
        { referralCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true }
      ]
    });
    
    // If not found, not approved, or not active, return error
    if (!ambassador) {
      console.log(`[COUPON REDEEM API] Invalid or inactive ambassador code used in order: ${normalizedCode}, OrderID: ${orderId}`);
      return responseWithCors({ error: 'Invalid or inactive ambassador code' }, 400, request);
    }
    
    console.log(`[COUPON REDEEM API] Valid ambassador code redeemed: ${normalizedCode}, ambassador: ${ambassador.name}, OrderID: ${orderId}`);
    
    // Calculate commission
    const commission = (orderAmount * ambassador.commissionRate) / 100;
    
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
    
    console.log('[COUPON REDEEM API] Ambassador stats updated successfully:', {
      ambassadorId: ambassador._id,
      newStats: {
        sales: updateResult.sales,
        earnings: updateResult.earnings,
        orders: updateResult.orders
      }
    });
    
    return responseWithCors({
      success: true,
      ambassadorId: ambassador._id,
      commission,
      message: 'Coupon redemption recorded successfully'
    }, 200, request);
    
  } catch (error: any) {
    console.error('[COUPON REDEEM API] Error processing redemption:', error);
    return responseWithCors({ 
      error: error.message || 'Failed to redeem coupon' 
    }, 500, request);
  }
} 