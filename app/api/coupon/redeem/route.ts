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
      orderAmount, // Keep for backward compatibility
      total, // Full amount (products + shipping)
      subtotal, // Products only  
      shippingCost, // Delivery cost
      discountAmount, // Applied discount
      customerEmail,
      products = []
    } = await request.json();
    
    console.log('[COUPON REDEEM API] Request data:', { 
      code, 
      orderId, 
      orderAmount, 
      total, 
      subtotal, 
      shippingCost, 
      discountAmount, 
      customerEmail 
    });
    
    if (!code || !orderId || (!orderAmount && !total && !subtotal)) {
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
    
    // ✅ NEW COMMISSION CALCULATION: (subtotal - discountAmount) × rate%
    // Use new structure if available, fallback to old orderAmount for backward compatibility
    let commissionableAmount: number;
    let orderTotal: number;
    
    if (subtotal !== undefined) {
      // New structure - commission only on product sales (excluding shipping)
      commissionableAmount = subtotal - (discountAmount || 0);
      orderTotal = total || (subtotal + (shippingCost || 0));
      
      console.log('[COUPON REDEEM API] Using new structure:', {
        subtotal,
        discountAmount: discountAmount || 0,
        shippingCost: shippingCost || 0,
        commissionableAmount,
        orderTotal
      });
    } else {
      // Backward compatibility - use old orderAmount
      commissionableAmount = orderAmount;
      orderTotal = orderAmount;
      
      console.log('[COUPON REDEEM API] Using legacy structure:', {
        orderAmount,
        commissionableAmount,
        orderTotal
      });
    }
    
    // Ensure commission amount is not negative
    commissionableAmount = Math.max(0, commissionableAmount);
    
    // Calculate commission on the commissionable amount only
    // Note: commissionRate is stored as decimal (e.g., 0.1 = 10%), so multiply by 100 if needed
    const commission = commissionableAmount * ambassador.commissionRate;
    
    console.log('[COUPON REDEEM API] Commission calculation:', {
      commissionableAmount,
      commissionRate: ambassador.commissionRate,
      commission,
      ambassadorName: ambassador.name
    });
    
    // Update ambassador stats
    const updateResult = await Ambassador.findByIdAndUpdate(
      ambassador._id,
      {
        $inc: {
          sales: commissionableAmount, // Track product sales only (excluding shipping)
          earnings: commission,
          orders: 1,
          paymentsPending: commission
        },
        $push: {
          recentOrders: {
            orderId,
            orderDate: new Date(),
            amount: commissionableAmount, // Store commissionable amount, not total
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