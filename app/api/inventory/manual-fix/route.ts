import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { logStock } from '@/app/utils/logger';

// Define types for the details array items
type ProductUpdateDetail = {
  productId?: any;
  item?: any;
  status: string;
  reason?: string;
  size?: any;
  color?: any;
  quantity?: any;
  oldStock?: number;
  newStock?: number;
  inventoryFixed?: boolean;
};

/**
 * Emergency fix endpoint that works for any order
 */
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const client = await clientPromise;
    const db = client.db();
    
    // Get order ID from query parameters
    const orderId = req.nextUrl.searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required as a query parameter' }, { status: 400 });
    }
    
    console.log(`Starting emergency fix for order ${orderId}`);
    
    // Find the order
    let order;
    try {
      order = await db.collection('orders').findOne({
        _id: new ObjectId(orderId)
      });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (!Array.isArray(order.products) || order.products.length === 0) {
      return NextResponse.json({ error: 'Order has no products' }, { status: 400 });
    }
    
    const results = {
      processingSuccess: true,
      orderProcessed: false,
      totalProductsUpdated: 0,
      totalUpdates: 0,
      details: [] as ProductUpdateDetail[]
    };
    
    // Process each product in the order
    for (const orderProduct of order.products) {
      // Skip already updated products based on flag
      if (orderProduct.inventoryUpdated) {
        results.details.push({
          productId: orderProduct.productId,
          status: 'skipped',
          reason: 'Already updated'
        });
        continue;
      }

      const productId = orderProduct.productId;
      const size = orderProduct.size || 'default';
      const color = orderProduct.color || 'default';
      const quantity = orderProduct.quantity || 1;
      
      if (!productId) {
        results.details.push({
          item: orderProduct,
          status: 'error',
          reason: 'Missing product ID'
        });
        continue;
      }
      
      console.log(`Processing: Size=${size}, Color=${color}, Quantity=${quantity}`);
      
      // Find the product
      let product;
      try {
        product = await db.collection('products').findOne({
          _id: new ObjectId(productId)
        });
      } catch (error) {
        results.details.push({
          productId,
          status: 'error',
          reason: 'Invalid product ID format'
        });
        results.processingSuccess = false;
        continue;
      }
      
      if (!product) {
        results.details.push({
          productId,
          status: 'error',
          reason: 'Product not found'
        });
        results.processingSuccess = false;
        continue;
      }
      
      const productResult = {
        productId,
        size,
        color,
        quantity,
        oldStock: undefined as number | undefined,
        newStock: undefined as number | undefined,
        inventoryFixed: false
      };
      
      // Try updating with sizeVariants structure
      if (Array.isArray(product.sizeVariants)) {
        const sizeVariant = product.sizeVariants.find((sv: any) => sv.size === size);
        
        if (sizeVariant && Array.isArray(sizeVariant.colorVariants)) {
          const colorVariant = sizeVariant.colorVariants.find((cv: any) => cv.color === color);
          
          if (colorVariant) {
            productResult.oldStock = colorVariant.stock;
            const newStock = Math.max(0, colorVariant.stock - quantity);
            productResult.newStock = newStock;
            
            await db.collection('products').updateOne(
              { 
                _id: new ObjectId(productId),
                "sizeVariants.size": size,
                "sizeVariants.colorVariants.color": color
              },
              { 
                $set: { 
                  "sizeVariants.$[sizeElem].colorVariants.$[colorElem].stock": newStock
                }
              },
              {
                arrayFilters: [
                  { "sizeElem.size": size },
                  { "colorElem.color": color }
                ]
              }
            );
            
            productResult.inventoryFixed = true;
            results.totalUpdates++;
          }
        }
      }
      
      // Also try updating with inventory.variants structure
      if (product.inventory && Array.isArray(product.inventory.variants)) {
        const variantIndex = product.inventory.variants.findIndex(
          (v: any) => v.size === size && (v.color === color || !v.color || v.color === '')
        );
        
        if (variantIndex >= 0) {
          const currentQty = product.inventory.variants[variantIndex].quantity || 0;
          const newQty = Math.max(0, currentQty - quantity);
          
          productResult.oldStock = productResult.oldStock !== undefined ? productResult.oldStock : currentQty;
          productResult.newStock = productResult.newStock !== undefined ? productResult.newStock : newQty;
          
          await db.collection('products').updateOne(
            { 
              _id: new ObjectId(productId),
              'inventory.variants.size': size,
              $or: [
                { 'inventory.variants.color': color },
                { 'inventory.variants.color': '' },
                { 'inventory.variants.color': { $exists: false } }
              ]
            },
            { 
              $set: { 
                [`inventory.variants.${variantIndex}.quantity`]: newQty
              }
            }
          );
          
          // Recalculate total inventory
          const updatedProduct = await db.collection('products').findOne({
            _id: new ObjectId(productId)
          });
          
          if (updatedProduct && updatedProduct.inventory) {
            let totalInventory = 0;
            if (Array.isArray(updatedProduct.inventory.variants)) {
              totalInventory = updatedProduct.inventory.variants.reduce(
                (sum: number, v: any) => sum + (v.quantity || 0),
                0
              );
            }
            
            await db.collection('products').updateOne(
              { _id: new ObjectId(productId) },
              { $set: { 'inventory.total': totalInventory } }
            );
          }
          
          productResult.inventoryFixed = true;
          results.totalUpdates++;
        }
      }
      
      if (productResult.inventoryFixed) {
        results.totalProductsUpdated++;
        results.details.push({
          ...productResult,
          status: 'success'
        });
      } else {
        results.details.push({
          ...productResult,
          status: 'error',
          reason: 'Could not find matching inventory structure'
        });
        results.processingSuccess = false;
      }
    }
    
    // Mark products as updated in the order
    if (results.totalProductsUpdated > 0) {
      const updatedOrderProducts = JSON.parse(JSON.stringify(order.products));
      
      for (let i = 0; i < updatedOrderProducts.length; i++) {
        const update = results.details.find(d => 
          d.productId === updatedOrderProducts[i].productId && 
          d.status === 'success'
        );
        
        if (update) {
          updatedOrderProducts[i].inventoryUpdated = true;
        }
      }
      
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { 
            products: updatedOrderProducts,
            inventoryUpdatedAt: new Date()
          } 
        }
      );
      
      results.orderProcessed = true;
    }
    
    return NextResponse.json({
      success: results.processingSuccess,
      message: results.totalProductsUpdated > 0 
        ? `Successfully updated ${results.totalProductsUpdated} products`
        : 'No products were updated',
      results
    });
    
  } catch (error: any) {
    console.error('Error in emergency fix API:', error);
    return NextResponse.json(
      { error: `Failed to apply emergency fix: ${error.message}` },
      { status: 500 }
    );
  }
} 