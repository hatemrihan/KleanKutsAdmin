import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '@/app/lib/mongoose';
import mongoose from 'mongoose';

// Define a schema for coupons
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: -1 }, // -1 means unlimited
  usedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

// Get or create the model
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

export async function POST(request: NextRequest) {
  try {
    await mongooseConnect();
    
    const data = await request.json();
    
    // Validate the required fields
    if (!data.code || !data.discount) {
      return NextResponse.json(
        { success: false, message: 'Coupon code and discount are required' },
        { status: 400 }
      );
    }
    
    // Check if the coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: data.code });
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon code already exists' },
        { status: 400 }
      );
    }
    
    // Create the coupon
    const coupon = await Coupon.create({
      code: data.code,
      discount: data.discount,
      productId: data.productId || null,
      expiresAt: data.expiresAt || null,
      usageLimit: data.usageLimit || -1
    });
    
    return NextResponse.json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create coupon', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await mongooseConnect();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const productId = searchParams.get('productId');
    
    let query: any = { isActive: true };
    
    if (code) {
      query.code = code;
    }
    
    if (productId) {
      query.productId = productId;
    }
    
    // For expired coupons
    if (query.isActive) {
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ];
    }
    
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupons', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await mongooseConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      );
    }
    
    const result = await Coupon.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete coupon', error: String(error) },
      { status: 500 }
    );
  }
} 