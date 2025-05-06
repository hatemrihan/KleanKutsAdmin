import { NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';

interface Variant {
  size: string;
  color: string;
  quantity: number;
}

interface ProductVariantSummary {
  total: number;
  byColor: Record<string, number>;
}

interface ProductSummary {
  id: string;
  title: string;
  hasVariants: boolean;
  variantCount: number;
  totalStock: number;
  bySizeStock: Record<string, ProductVariantSummary>;
  hasDuplicateSizes: boolean;
}

/**
 * Utility endpoint to check and fix inventory data
 * This is helpful for diagnosing and fixing sync issues between admin and e-commerce
 */
export async function GET() {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    // Get all products
    const products = await db.collection('products').find({
      deleted: { $ne: true }
    }).toArray();
    
    const summary: ProductSummary[] = [];
    
    // Check each product's variants
    for (const product of products) {
      const productSummary: ProductSummary = {
        id: product._id.toString(),
        title: product.title,
        hasVariants: Array.isArray(product.variants) && product.variants.length > 0,
        variantCount: Array.isArray(product.variants) ? product.variants.length : 0,
        totalStock: 0,
        bySizeStock: {},
        hasDuplicateSizes: false
      };
      
      if (productSummary.hasVariants) {
        // Count total stock
        productSummary.totalStock = product.variants.reduce((sum: number, v: Variant) => {
          const quantity = typeof v.quantity === 'number' ? v.quantity : 0;
          return sum + quantity;
        }, 0);
        
        // Group by size
        const sizes: Record<string, ProductVariantSummary> = {};
        for (const variant of product.variants) {
          if (!variant.size) continue;
          
          if (!sizes[variant.size]) {
            sizes[variant.size] = {
              total: 0,
              byColor: {}
            };
          }
          
          const quantity = typeof variant.quantity === 'number' ? variant.quantity : 0;
          sizes[variant.size].total += quantity;
          
          const color = variant.color || 'default';
          if (!sizes[variant.size].byColor[color]) {
            sizes[variant.size].byColor[color] = 0;
          }
          sizes[variant.size].byColor[color] += quantity;
        }
        
        productSummary.bySizeStock = sizes;
        
        // Check for duplicate size/color combinations
        const sizeColorCombos = new Set();
        for (const variant of product.variants) {
          const combo = `${variant.size}:${variant.color || 'default'}`;
          if (sizeColorCombos.has(combo)) {
            productSummary.hasDuplicateSizes = true;
          } else {
            sizeColorCombos.add(combo);
          }
        }
      }
      
      summary.push(productSummary);
    }
    
    return NextResponse.json({
      totalProducts: products.length,
      summary
    });
    
  } catch (error) {
    console.error('Error in GET /api/inventory/sync:', error);
    return NextResponse.json(
      { error: 'Failed to check inventory data' },
      { status: 500 }
    );
  }
} 