import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { mongooseConnect } from '@/app/lib/mongoose';

// Get the Coupon model
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: -1 },
  usedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

// Use existing model or create a new one
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

// POST /api/coupon/validate - Validate a coupon code and get its discount percentage
export async function POST(request: NextRequest) {
  try {
    // For CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }
    
    // Ensure MongoDB connection is established
    await mongooseConnect();
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { code, productId } = body;
    
    console.log('Validating coupon:', { code, productId });
    
    // Validate request
    if (!code) {
      console.log('Missing coupon code');
      return createResponse({ 
        valid: false, 
        message: 'Coupon code is required' 
      }, 400);
    }
    
    // Normalize code to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    
    // First check for regular coupon codes
    let coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${normalizedCode}$`, 'i') },
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    console.log('Coupon search result:', coupon ? 'Found' : 'Not found');
    
    // If coupon found, check product-specific conditions
    if (coupon) {
      // If this is a product-specific coupon, check it's for the right product
      if (coupon.productId && productId && coupon.productId.toString() !== productId) {
        console.log('Product mismatch');
        return createResponse({ 
          valid: false, 
          message: 'This coupon is not valid for this product' 
        });
      }
      
      // Check usage limits
      if (coupon.usageLimit !== -1 && coupon.usedCount >= coupon.usageLimit) {
        console.log('Usage limit reached');
        return createResponse({ 
          valid: false, 
          message: 'This coupon has reached its usage limit' 
        });
      }
      
      // Valid coupon found
      console.log(`Valid regular coupon code used: ${normalizedCode}`);
      
      // Return validation result with discount information
      return createResponse({
        valid: true,
        discount: {
          type: 'percentage',
          value: coupon.discount,
          couponId: coupon._id
        },
        message: `Coupon code applied: ${coupon.discount}% discount`
      });
    }
    
    // If no regular coupon found, check for ambassador coupons
    console.log('Checking for ambassador coupon');
    const ambassador = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true },
        { referralCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved', isActive: true }
      ]
    });
    
    console.log('Ambassador search result:', ambassador ? 'Found' : 'Not found');
    
    // If not found, inactive, or not approved, return invalid
    if (!ambassador) {
      console.log(`Invalid coupon code attempted: ${normalizedCode}`);
      return createResponse({ 
        valid: false, 
        message: 'Invalid or expired coupon code'
      });
    }
    
    console.log(`Valid ambassador coupon code used: ${normalizedCode}, ambassador: ${ambassador.name}`);
    
    // Return validation result with discount information AND commission rate
    return createResponse({
      valid: true,
      discount: {
        type: 'percentage',
        value: ambassador.discountPercent,
        ambassadorId: ambassador._id
      },
      commissionRate: ambassador.commissionRate * 100, // Convert decimal to percentage (e.g., 0.1 -> 10)
      message: `Coupon code applied: ${ambassador.discountPercent}% discount`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return createResponse({ 
      valid: false, 
      message: 'Failed to validate coupon code',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS() {
  return handleCors();
}

// Helper function to create a response with CORS headers
function createResponse(data: any, status = 200) {
  const response = NextResponse.json(data, { status });
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'https://elevee.netlify.app');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  return response;
}

// Helper function for CORS preflight
function handleCors() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://elevee.netlify.app',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    },
  });
} 