import { NextRequest, NextResponse } from 'next/server';
import { BLACKLISTED_PRODUCT_IDS } from '../../../utils/productBlacklist';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/products/blacklist
 * Returns the list of blacklisted product IDs
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      blacklistedProducts: BLACKLISTED_PRODUCT_IDS
    });
  } catch (error) {
    console.error('Error in GET /api/products/blacklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklisted products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/blacklist/validate
 * Validates a list of product IDs against the database and blacklist
 * Returns which products exist, which are deleted, and which are blacklisted
 */
export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json();
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Convert string IDs to ObjectIds for valid MongoDB query
    const objectIds = productIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    // Find which products exist in the database
    const existingProducts = await db.collection('products')
      .find({ 
        _id: { $in: objectIds },
        deleted: { $ne: true } // Exclude soft-deleted products
      })
      .project({ _id: 1 })
      .toArray();
    
    // Extract IDs of existing products
    const existingProductIds = existingProducts.map(p => p._id.toString());
    
    // Find which products are blacklisted
    const blacklistedIds = productIds.filter(id => BLACKLISTED_PRODUCT_IDS.includes(id));
    
    // Find which products are missing or deleted
    const missingOrDeletedIds = productIds.filter(id => 
      !existingProductIds.includes(id) && !blacklistedIds.includes(id)
    );
    
    return NextResponse.json({
      valid: existingProductIds,
      blacklisted: blacklistedIds,
      missingOrDeleted: missingOrDeletedIds
    });
  } catch (error) {
    console.error('Error in POST /api/products/blacklist/validate:', error);
    return NextResponse.json(
      { error: 'Failed to validate products' },
      { status: 500 }
    );
  }
}
