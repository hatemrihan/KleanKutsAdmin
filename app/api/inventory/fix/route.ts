import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { logStock } from '@/app/utils/logger';

/**
 * API endpoint to fix inventory inconsistencies
 * This ensures all products use a consistent inventory structure
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    const productId = req.nextUrl.searchParams.get('productId');
    const fixAll = req.nextUrl.searchParams.get('all') === 'true';
    
    const results = {
      processed: 0,
      updated: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Query to find products with inconsistent inventory
    const query: any = { deleted: { $ne: true } };
    
    // If productId is specified, fix only that product
    if (productId && !fixAll) {
      try {
        query._id = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid product ID format' },
          { status: 400 }
        );
      }
    }
    
    // Get all products matching the query
    const products = await db.collection('products').find(query).toArray();
    
    console.log(`Found ${products.length} products to process`);
    
    // Process each product
    for (const product of products) {
      try {
        results.processed++;
        let updated = false;
        const updates: any = {};
        
        // Case 1: Product has sizeVariants but no inventory
        if (Array.isArray(product.sizeVariants) && (!product.inventory || !product.inventory.variants)) {
          console.log(`Product ${product._id} has sizeVariants but no inventory structure`);
          
          // Create inventory from sizeVariants
          const variants = [];
          let total = 0;
          
          for (const sizeVariant of product.sizeVariants) {
            if (Array.isArray(sizeVariant.colorVariants)) {
              for (const colorVariant of sizeVariant.colorVariants) {
                variants.push({
                  size: sizeVariant.size,
                  color: colorVariant.color,
                  quantity: colorVariant.stock || 0
                });
                total += colorVariant.stock || 0;
              }
            }
          }
          
          if (variants.length > 0) {
            updates.inventory = {
              total,
              variants
            };
            updated = true;
          }
        }
        
        // Case 2: Product has inventory but no sizeVariants
        if (product.inventory && Array.isArray(product.inventory.variants) && !Array.isArray(product.sizeVariants)) {
          console.log(`Product ${product._id} has inventory but no sizeVariants`);
          
          // Create sizeVariants from inventory
          const sizeVariants = [];
          const sizeMap = new Map();
          
          for (const variant of product.inventory.variants) {
            const size = variant.size;
            const color = variant.color || 'Default';
            const quantity = variant.quantity || 0;
            
            if (!sizeMap.has(size)) {
              sizeMap.set(size, {
                size,
                colorVariants: []
              });
            }
            
            const sizeVariant = sizeMap.get(size);
            sizeVariant.colorVariants.push({
              color,
              stock: quantity
            });
          }
          
          if (sizeMap.size > 0) {
            updates.sizeVariants = Array.from(sizeMap.values());
            updated = true;
          }
        }
        
        // Case 3: Both structures exist but might be out of sync
        if (Array.isArray(product.sizeVariants) && product.inventory && Array.isArray(product.inventory.variants)) {
          console.log(`Product ${product._id} has both structures, checking for inconsistencies`);
          
          const inventoryMap = new Map();
          for (const variant of product.inventory.variants) {
            const key = `${variant.size}:${variant.color || 'Default'}`;
            inventoryMap.set(key, variant.quantity || 0);
          }
          
          let needsSync = false;
          const sizeVariants = JSON.parse(JSON.stringify(product.sizeVariants));
          
          for (const sizeVariant of sizeVariants) {
            if (Array.isArray(sizeVariant.colorVariants)) {
              for (const colorVariant of sizeVariant.colorVariants) {
                const key = `${sizeVariant.size}:${colorVariant.color}`;
                const inventoryQty = inventoryMap.get(key);
                
                if (inventoryQty !== undefined && inventoryQty !== colorVariant.stock) {
                  console.log(`Inconsistency found: ${key} - sizeVariants: ${colorVariant.stock}, inventory: ${inventoryQty}`);
                  // Use the inventory value as the source of truth
                  colorVariant.stock = inventoryQty;
                  needsSync = true;
                }
              }
            }
          }
          
          if (needsSync) {
            updates.sizeVariants = sizeVariants;
            updated = true;
          }
        }
        
        // Apply updates if needed
        if (updated) {
          console.log(`Updating product ${product._id} with fixed inventory`);
          await db.collection('products').updateOne(
            { _id: product._id },
            { $set: updates }
          );
          
          results.updated++;
          results.details.push({
            productId: product._id.toString(),
            name: product.name || product.title,
            updates: Object.keys(updates)
          });
        }
      } catch (productError: any) {
        console.error(`Error fixing product ${product._id}:`, productError);
        results.errors.push(`Error fixing product ${product._id}: ${productError.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      ...results
    });
    
  } catch (error: any) {
    console.error('Error in inventory fix API:', error);
    return NextResponse.json(
      { error: `Failed to fix inventory: ${error.message}` },
      { status: 500 }
    );
  }
} 