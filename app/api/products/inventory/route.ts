import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * API route to check product inventory by product ID and size
 * This handles inventory queries for the e-commerce frontend
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const size = searchParams.get('size');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find the product
    const product = await db.collection('products').findOne({
      _id: new ObjectId(productId),
      deleted: { $ne: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If size is provided, return inventory for that specific size
    if (size) {
      const variant = product.variants?.find((v: any) => v.size === size);
      
      if (!variant) {
        return NextResponse.json(
          { error: 'Size not found for this product' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        productId,
        size,
        quantity: variant.quantity || 0,
        color: variant.color || 'default',
        available: (variant.quantity || 0) > 0
      });
    }
    
    // If no size provided, return inventory for all sizes
    const inventory = product.variants?.map((variant: any) => ({
      size: variant.size,
      quantity: variant.quantity || 0,
      color: variant.color || 'default',
      available: (variant.quantity || 0) > 0
    })) || [];
    
    return NextResponse.json({
      productId,
      inventory
    });
    
  } catch (error) {
    console.error('Error in GET /api/products/inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product inventory' },
      { status: 500 }
    );
  }
}

// Update inventory when a purchase is made
export async function POST(req: NextRequest) {
  try {
    await mongooseConnect();
    const { productId, size, quantity = 1 } = await req.json();
    
    if (!productId || !size) {
      return NextResponse.json(
        { error: 'Product ID and size are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find the product and update the inventory for the specified size
    const result = await db.collection('products').findOneAndUpdate(
      {
        _id: new ObjectId(productId),
        'variants.size': size,
        deleted: { $ne: true }
      },
      {
        $inc: { 'variants.$.quantity': -Math.abs(quantity) }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 404 }
      );
    }
    
    // Find the updated variant
    const updatedVariant = result.variants?.find((v: any) => v.size === size);
    
    return NextResponse.json({
      productId,
      size,
      quantity: updatedVariant?.quantity || 0,
      updated: true
    });
    
  } catch (error) {
    console.error('Error in POST /api/products/inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update product inventory' },
      { status: 500 }
    );
  }
} 