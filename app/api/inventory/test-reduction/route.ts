import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * API endpoint to test inventory reduction
 * This simulates what happens when an order is placed
 */
export async function POST(req: NextRequest) {
  try {
    await mongooseConnect();
    const { productId, size, color, quantity } = await req.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Get initial product state
    let product;
    try {
      product = await db.collection('products').findOne({
        _id: new ObjectId(productId),
        deleted: { $ne: true }
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Extract the variant's current quantity
    const inventoryBeforeUpdate = { ...product.inventory };
    
    // Find the matching variant
    const variants = product.inventory?.variants || [];
    const variantSize = size || 'Default';
    const variantColor = color || 'Default';
    const orderQuantity = quantity || 1;
    
    const variantIndex = variants.findIndex(
      (v: any) => v.size === variantSize && (v.color === variantColor || !v.color || v.color === '')
    );

    const variantQuantityBefore = variantIndex >= 0 ? variants[variantIndex]?.quantity || 0 : 'not found';

    // Create a simulated order
    const simulatedOrder = {
      _id: new ObjectId(),
      createdAt: new Date(),
      status: 'processing',
      products: [
        {
          productId: productId,
          title: product.title,
          size: variantSize,
          color: variantColor,
          quantity: orderQuantity,
          price: product.price || 0
        }
      ],
      totalPrice: (product.price || 0) * orderQuantity
    };

    // Insert the simulated order
    await db.collection('orders').insertOne(simulatedOrder);
    console.log(`Created simulated order ${simulatedOrder._id.toString()}`);

    // Call the inventory update endpoint
    const response = await fetch(`${req.nextUrl.origin}/api/inventory/update-from-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: simulatedOrder._id.toString()
      })
    });

    const updateResult = await response.json();

    // Get the product state after update
    const productAfterUpdate = await db.collection('products').findOne({
      _id: new ObjectId(productId)
    });

    // Extract the variant's updated quantity
    const inventoryAfterUpdate = productAfterUpdate?.inventory;
    
    const variantsAfter = productAfterUpdate?.inventory?.variants || [];
    const variantIndexAfter = variantsAfter.findIndex(
      (v: any) => v.size === variantSize && (v.color === variantColor || !v.color || v.color === '')
    );

    const variantQuantityAfter = variantIndexAfter >= 0 ? variantsAfter[variantIndexAfter]?.quantity || 0 : 'not found';

    return NextResponse.json({
      success: true,
      product: {
        id: productId,
        title: product.title
      },
      variant: {
        size: variantSize,
        color: variantColor,
        quantityBefore: variantQuantityBefore,
        quantityAfter: variantQuantityAfter,
        reduced: typeof variantQuantityBefore === 'number' && typeof variantQuantityAfter === 'number' 
          ? variantQuantityBefore - variantQuantityAfter 
          : 'unknown'
      },
      totalInventoryBefore: inventoryBeforeUpdate?.total || 0,
      totalInventoryAfter: inventoryAfterUpdate?.total || 0,
      orderId: simulatedOrder._id.toString(),
      updateResult
    });
  } catch (error: any) {
    console.error('Error in POST /api/inventory/test-reduction:', error);
    return NextResponse.json(
      { error: `Failed to test inventory reduction: ${error.message}` },
      { status: 500 }
    );
  }
} 