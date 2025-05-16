import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// Mock data for testing and development
const mockAmbassadors = [
  {
    _id: '68245f1fc34dec68558a4178',
    name: 'Hatem Rihan',
    email: 'hatemrihan1980@gmail.com',
    phone: '+201234567890',
    code: 'hatemra3Bn',
    referralCode: 'hatemra3Bn',
    referralLink: 'https://elevee.netlify.app?ref=hatemra38n',
    couponCode: 'hatemm',
    status: 'approved',
    isActive: true,
    commissionRate: 20,
    ordersCount: 1,
    totalEarnings: 295,
    sales: 1475,
    earnings: 295,
    paymentsPending: 295,
    paymentsPaid: 0,
    referrals: 0,
    orders: 1,
    conversions: 0,
    createdAt: new Date('2023-05-15')
  },
  {
    _id: '68245f1fc34dec68558a4179',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@example.com',
    phone: '+201098765432',
    code: 'SARAH42',
    referralCode: 'SARAH42',
    referralLink: 'https://elevee.netlify.app?ref=SARAH42',
    couponCode: 'sarah20',
    status: 'approved',
    isActive: true,
    commissionRate: 15,
    ordersCount: 5,
    totalEarnings: 750,
    sales: 5000,
    earnings: 750,
    paymentsPending: 450,
    paymentsPaid: 300,
    referrals: 2,
    orders: 5,
    conversions: 2,
    createdAt: new Date('2023-06-10')
  }
];

// GET /api/ambassadors - Get all ambassadors
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Get status filter from URL params if it exists
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query based on status filter
    const query = status ? { status } : {};
    
    const ambassadors = await Ambassador.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ ambassadors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ambassadors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ambassadors' },
      { status: 500 }
    );
  }
}

// POST /api/ambassadors - Update ambassador status
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { id, status, couponCode, discountPercent } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if status is valid
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const updateData: any = { status };
    
    // If approving and coupon code provided, update it
    if (status === 'approved') {
      if (couponCode) {
        updateData.couponCode = couponCode;
      }
      
      // Update discount percent if provided
      if (discountPercent !== undefined) {
        updateData.discountPercent = discountPercent;
      }
    }
    
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ambassador }, { status: 200 });
  } catch (error) {
    console.error('Error updating ambassador:', error);
    return NextResponse.json(
      { error: 'Failed to update ambassador' },
      { status: 500 }
    );
  }
} 