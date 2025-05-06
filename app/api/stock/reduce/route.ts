import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface StockInfo {
  originalStock: number;
  size: string;
  color: string;
}

interface StockReductionItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  _stockInfo?: StockInfo;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const items: StockReductionItem[] = body.items;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Process each item
    const results = [];
    const errors = [];
    
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || !color || !quantity) {
        errors.push({ item, error: 'Missing required fields' });
        continue;
      }
      
      try {
        // Find the product
        const product = await productsCollection.findOne({ 
          _id: new ObjectId(productId) 
        });
        
        if (!product) {
          errors.push({ item, error: 'Product not found' });
          continue;
        }
        
        // Find the size variant
        const sizeVariant = product.sizeVariants?.find(
          (sv: any) => sv.size === size
        );
        
        if (!sizeVariant) {
          errors.push({ item, error: 'Size variant not found' });
          continue;
        }
        
        // Find the color variant
        const colorVariant = sizeVariant.colorVariants?.find(
          (cv: any) => cv.color === color
        );
        
        if (!colorVariant) {
          errors.push({ item, error: 'Color variant not found' });
          continue;
        }
        
        // Check if there's enough stock
        if (colorVariant.stock < quantity) {
          errors.push({ 
            item, 
            error: 'Insufficient stock', 
            available: colorVariant.stock 
          });
          continue;
        }
        
        // Update the stock
        const updateResult = await productsCollection.updateOne(
          { 
            _id: new ObjectId(productId),
            "sizeVariants.size": size,
            "sizeVariants.colorVariants.color": color
          },
          { 
            $inc: { 
              "sizeVariants.$[sizeElem].colorVariants.$[colorElem].stock": -quantity 
            } 
          },
          {
            arrayFilters: [
              { "sizeElem.size": size },
              { "colorElem.color": color }
            ]
          }
        );
        
        if (updateResult.modifiedCount === 0) {
          errors.push({ item, error: 'Failed to update stock' });
          continue;
        }
        
        results.push({
          productId,
          size,
          color,
          quantity,
          newStock: colorVariant.stock - quantity,
          status: 'success'
        });
      } catch (itemError: any) {
        console.error('Error processing item:', itemError);
        errors.push({ 
          item, 
          error: `Error processing item: ${itemError.message}` 
        });
      }
    }
    
    // Return results
    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Stock reduction API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
