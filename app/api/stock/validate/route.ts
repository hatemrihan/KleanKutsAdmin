import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface StockValidationItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const items: StockValidationItem[] = body.items;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Validate each item
    const validItems = [];
    const invalidItems = [];
    
    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      if (!productId || !size || !color || !quantity) {
        invalidItems.push({ 
          item, 
          error: 'Missing required fields' 
        });
        continue;
      }
      
      try {
        // Find the product
        const product = await productsCollection.findOne({ 
          _id: new ObjectId(productId) 
        });
        
        if (!product) {
          invalidItems.push({ 
            item, 
            error: 'Product not found' 
          });
          continue;
        }
        
        // Find the size variant
        const sizeVariant = product.sizeVariants?.find(
          (sv: any) => sv.size === size
        );
        
        if (!sizeVariant) {
          invalidItems.push({ 
            item, 
            error: 'Size variant not found' 
          });
          continue;
        }
        
        // Find the color variant
        const colorVariant = sizeVariant.colorVariants?.find(
          (cv: any) => cv.color === color
        );
        
        if (!colorVariant) {
          invalidItems.push({ 
            item, 
            error: 'Color variant not found' 
          });
          continue;
        }
        
        // Check if there's enough stock
        if (colorVariant.stock < quantity) {
          invalidItems.push({ 
            item, 
            error: 'Insufficient stock', 
            available: colorVariant.stock,
            requested: quantity
          });
          continue;
        }
        
        // Item is valid
        validItems.push({
          ...item,
          available: colorVariant.stock,
          status: 'valid'
        });
        
      } catch (itemError: any) {
        console.error('Error validating item:', itemError);
        invalidItems.push({ 
          item, 
          error: `Error validating item: ${itemError.message}` 
        });
      }
    }
    
    // Return validation results
    return NextResponse.json({
      valid: invalidItems.length === 0,
      validItems,
      invalidItems: invalidItems.length > 0 ? invalidItems : undefined
    });
    
  } catch (error: any) {
    console.error('Stock validation API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
