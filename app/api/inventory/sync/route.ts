import { NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
    
    // Log the database connection status
    console.log('Connected to MongoDB database for inventory sync');
    
    // Get all legitimate products with their inventory data
    // Filter out test data and unpublished products
    const products = await db.collection('products').find({
      deleted: { $ne: true },
      published: true,
      // Remove strict filtering that required description and images
      // Instead filter out products with inappropriate names
      title: { 
        $not: { 
          $in: [/^(test|fuck|f.ck|shit|damn|ass|dick|porn|xxx)$/i, /^[a-z]{1,2}$/i] 
        } 
      }
    }).toArray();
    
    console.log(`Found ${products.length} valid products to check inventory`);
    
    const summary: ProductSummary[] = [];
    
    // Check each product's inventory
    for (const product of products) {
      console.log(`Processing product: ${product.title || 'Unnamed product'}, ID: ${product._id}`);
      
      const productSummary: ProductSummary = {
        id: product._id.toString(),
        title: product.title || 'Unnamed Product',
        hasVariants: false,
        variantCount: 0,
        totalStock: 0,
        bySizeStock: {},
        hasDuplicateSizes: false
      };
      
      // Check for inventory in the product.inventory field (new structure)
      if (product.inventory && Array.isArray(product.inventory.variants)) {
        productSummary.hasVariants = true;
        productSummary.variantCount = product.inventory.variants.length;
        
        // Count total stock from inventory structure
        let totalStock = 0;
        const sizes: Record<string, ProductVariantSummary> = {};
        
        for (const variant of product.inventory.variants) {
          if (!variant.size) continue;
          
          const quantity = typeof variant.quantity === 'number' ? variant.quantity : 0;
          totalStock += quantity;
          
          // Group by size
          if (!sizes[variant.size]) {
            sizes[variant.size] = {
              total: 0,
              byColor: {}
            };
          }
          
          sizes[variant.size].total += quantity;
          
          const color = variant.color || 'Default';
          if (!sizes[variant.size].byColor[color]) {
            sizes[variant.size].byColor[color] = 0;
          }
          sizes[variant.size].byColor[color] += quantity;
        }
        
        productSummary.totalStock = totalStock;
        productSummary.bySizeStock = sizes;
        
        // Check for duplicate size/color combinations
        const sizeColorCombos = new Set();
        for (const variant of product.inventory.variants) {
          const combo = `${variant.size}:${variant.color || 'Default'}`;
          if (sizeColorCombos.has(combo)) {
            productSummary.hasDuplicateSizes = true;
          } else {
            sizeColorCombos.add(combo);
          }
        }
      } 
      // Check for old variant structure (fallback)
      else if (Array.isArray(product.variants)) {
        productSummary.hasVariants = true;
        productSummary.variantCount = product.variants.length;
        
        // Count total stock
        let totalStock = 0;
        const sizes: Record<string, ProductVariantSummary> = {};
        
        for (const variant of product.variants) {
          if (!variant.size) continue;
          
          const quantity = typeof variant.quantity === 'number' ? variant.quantity : 0;
          totalStock += quantity;
          
          // Group by size
          if (!sizes[variant.size]) {
            sizes[variant.size] = {
              total: 0,
              byColor: {}
            };
          }
          
          sizes[variant.size].total += quantity;
          
          const color = variant.color || 'Default';
          if (!sizes[variant.size].byColor[color]) {
            sizes[variant.size].byColor[color] = 0;
          }
          sizes[variant.size].byColor[color] += quantity;
        }
        
        productSummary.totalStock = totalStock;
        productSummary.bySizeStock = sizes;
        
        // Check for duplicate size/color combinations
        const sizeColorCombos = new Set();
        for (const variant of product.variants) {
          const combo = `${variant.size}:${variant.color || 'Default'}`;
          if (sizeColorCombos.has(combo)) {
            productSummary.hasDuplicateSizes = true;
          } else {
            sizeColorCombos.add(combo);
          }
        }
      }
      
      summary.push(productSummary);
    }
    
    // If we don't have any products with inventory, try to initialize inventory for products
    if (summary.length === 0 || summary.every(p => p.totalStock === 0)) {
      console.log('No products with inventory found. Attempting to fix...');
      
      try {
        // Find real products with variants but no inventory
        const productsToFix = await db.collection('products').find({
          deleted: { $ne: true },
          published: true,
          // Use the same filtering criteria for consistent results
          title: { 
            $not: { 
              $in: [/^(test|fuck|f.ck|shit|damn|ass|dick|porn|xxx)$/i, /^[a-z]{1,2}$/i] 
            } 
          },
          variants: { $exists: true, $ne: [] },
          inventory: { $exists: false }
        }).toArray();
        
        console.log(`Found ${productsToFix.length} products with variants to fix inventory`);
        
        // Initialize inventory for these products
        for (const product of productsToFix) {
          if (!Array.isArray(product.variants)) continue;
          
          const variants = product.variants.map((v: any) => ({
            size: v.size || 'Default',
            color: v.color || 'Default',
            quantity: v.quantity || 10 // Initialize with default stock if none exists
          }));
          
          const totalQuantity = variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0);
          
          await db.collection('products').updateOne(
            { _id: new ObjectId(product._id) },
            {
              $set: {
                inventory: {
                  total: totalQuantity,
                  variants: variants
                }
              }
            }
          );
          
          console.log(`Initialized inventory for product ${product.title || 'Unnamed'}`);
        }
        
        // Also find products without variants and without inventory and initialize them
        const productsWithoutVariants = await db.collection('products').find({
          deleted: { $ne: true },
          published: true,
          title: { 
            $not: { 
              $in: [/^(test|fuck|f.ck|shit|damn|ass|dick|porn|xxx)$/i, /^[a-z]{1,2}$/i] 
            } 
          },
          $or: [
            { variants: { $exists: false } },
            { variants: { $size: 0 } },
            { variants: [] }
          ],
          inventory: { $exists: false }
        }).toArray();
        
        console.log(`Found ${productsWithoutVariants.length} products without variants to fix inventory`);
        
        // Initialize inventory for products without variants
        for (const product of productsWithoutVariants) {
          // Create a default variant with 10 units
          const defaultVariant = {
            size: 'Default',
            color: 'Default',
            quantity: 10
          };
          
          await db.collection('products').updateOne(
            { _id: new ObjectId(product._id) },
            {
              $set: {
                inventory: {
                  total: 10,
                  variants: [defaultVariant]
                }
              }
            }
          );
          
          console.log(`Initialized default inventory for product ${product.title || 'Unnamed'}`);
        }
        
        // Now fetch products again
        return NextResponse.json({
          status: 'inventory_initialized',
          message: 'Inventory has been initialized for products that were missing it. Please refresh to see updated data.',
          productsFixed: productsToFix.length + productsWithoutVariants.length
        });
      } catch (fixError) {
        console.error('Error fixing inventory:', fixError);
      }
    }
    
    // Return the summary
    return NextResponse.json({
      totalProducts: products.length,
      summary: summary.sort((a, b) => b.totalStock - a.totalStock) // Sort by stock level
    });
    
  } catch (error) {
    console.error('Error in GET /api/inventory/sync:', error);
    return NextResponse.json(
      { error: 'Failed to check inventory data' },
      { status: 500 }
    );
  }
} 