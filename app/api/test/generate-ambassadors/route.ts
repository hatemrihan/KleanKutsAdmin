import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// GET /api/test/generate-ambassadors - Generate test ambassador data
export async function GET(request: NextRequest) {
  try {
    // This endpoint should only be accessible in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Sample test data
    const testAmbassadors = [
      {
        name: 'Test Ambassador 10%',
        email: 'test10@example.com',
        userId: 'testuser1',
        status: 'approved',
        couponCode: 'TEST10',
        discountPercent: 10,
        commissionRate: 0.10,
        reason: 'Test ambassador with 10% discount',
        sales: 1000,
        earnings: 100,
        referrals: 20,
        orders: 10,
        conversions: 8,
        paymentsPending: 50,
        paymentsPaid: 50,
        recentOrders: [
          {
            orderId: 'TEST-ORD-001',
            orderDate: new Date(),
            amount: 200,
            commission: 20,
            isPaid: true
          },
          {
            orderId: 'TEST-ORD-002',
            orderDate: new Date(),
            amount: 300,
            commission: 30,
            isPaid: false
          }
        ]
      },
      {
        name: 'Test Ambassador 20%',
        email: 'test20@example.com',
        userId: 'testuser2',
        status: 'approved',
        couponCode: 'TEST20',
        discountPercent: 20,
        commissionRate: 0.15,
        reason: 'Test ambassador with 20% discount',
        sales: 2000,
        earnings: 300,
        referrals: 30,
        orders: 15,
        conversions: 12,
        paymentsPending: 150,
        paymentsPaid: 150,
        recentOrders: [
          {
            orderId: 'TEST-ORD-003',
            orderDate: new Date(),
            amount: 500,
            commission: 75,
            isPaid: true
          },
          {
            orderId: 'TEST-ORD-004',
            orderDate: new Date(),
            amount: 400,
            commission: 60,
            isPaid: false
          }
        ]
      },
      {
        name: 'Pending Ambassador',
        email: 'pending@example.com',
        userId: 'pendinguser',
        status: 'pending',
        reason: 'Test pending ambassador application',
      }
    ];
    
    // Clear existing test ambassadors
    await Ambassador.deleteMany({
      email: { $in: testAmbassadors.map(a => a.email) }
    });
    
    // Create new test ambassadors
    const created = await Ambassador.create(testAmbassadors);
    
    return NextResponse.json({
      success: true,
      message: `Created ${created.length} test ambassadors`,
      ambassadors: created.map(a => ({
        name: a.name,
        email: a.email,
        status: a.status,
        couponCode: a.couponCode,
        referralCode: a.referralCode,
        discountPercent: a.discountPercent
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating test ambassadors:', error);
    return NextResponse.json(
      { error: 'Failed to generate test ambassadors' },
      { status: 500 }
    );
  }
} 