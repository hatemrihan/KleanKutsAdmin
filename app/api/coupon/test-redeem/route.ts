import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// Test endpoint to manually redeem a coupon for testing
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { couponCode } = await request.json();
    
    if (!couponCode) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }
    
    // Test data
    const testOrderAmount = 100;
    const testOrderId = `TEST-${Date.now()}`;
    
    // Find ambassador
    const ambassador = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${couponCode}$`, 'i') }, status: 'approved' },
        { referralCode: { $regex: new RegExp(`^${couponCode}$`, 'i') }, status: 'approved' }
      ]
    });
    
    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found or not approved' }, { status: 404 });
    }
    
    // Calculate commission
    const commission = testOrderAmount * ambassador.commissionRate;
    
    // Update ambassador stats
    const updatedAmbassador = await Ambassador.findByIdAndUpdate(
      ambassador._id,
      {
        $inc: {
          sales: testOrderAmount,
          earnings: commission,
          orders: 1,
          paymentsPending: commission
        },
        $push: {
          recentOrders: {
            orderId: testOrderId,
            orderDate: new Date(),
            amount: testOrderAmount,
            commission,
            isPaid: false
          }
        }
      },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Test coupon redeemed successfully',
      testData: {
        orderId: testOrderId,
        orderAmount: testOrderAmount,
        commission,
        ambassador: {
          name: updatedAmbassador.name,
          newStats: {
            sales: updatedAmbassador.sales,
            earnings: updatedAmbassador.earnings,
            orders: updatedAmbassador.orders
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error testing coupon redemption:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 