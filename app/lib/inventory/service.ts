import { ObjectId } from 'mongodb';
import clientPromise from '../mongodb';
import { mongooseConnect } from '../mongoose';
import { logStock } from '@/app/utils/logger';

export interface InventoryUpdateRequest {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  transactionId?: string;
}

export interface InventoryUpdateResult {
  productId: string;
  size: string;
  color: string;
  previousQuantity: number;
  newQuantity: number;
  transactionId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Connect to MongoDB
async function getDb() {
  await mongooseConnect();
  const client = await clientPromise;
  return client.db();
}

// Log inventory changes to a separate collection for auditing
async function logInventoryChange(change: InventoryUpdateResult) {
  try {
    const db = await getDb();
    await db.collection('inventoryAudit').insertOne({
      ...change,
      createdAt: new Date()
    });
    logStock(`Inventory change logged: ${change.productId}, ${change.size}, ${change.color}, from ${change.previousQuantity} to ${change.newQuantity}`, 'info');
  } catch (error) {
    console.error('Failed to log inventory change:', error);
  }
}

// Standard function to reduce inventory
export async function reduceInventory(request: InventoryUpdateRequest): Promise<InventoryUpdateResult> {
  const { productId, size, color, quantity, transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` } = request;
  
  const result: InventoryUpdateResult = {
    productId,
    size,
    color,
    previousQuantity: 0,
    newQuantity: 0,
    transactionId,
    timestamp: new Date(),
    success: false
  };
  
  try {
    const db = await getDb();
    
    // Check if this transaction was already processed
    const existingTransaction = await db.collection('inventoryAudit').findOne({ transactionId });
    if (existingTransaction) {
      logStock(`Duplicate transaction detected: ${transactionId}`, 'warn');
      return existingTransaction as unknown as InventoryUpdateResult;
    }
    
    // Find the product
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      result.error = 'Product not found';
      await logInventoryChange(result);
      return result;
    }
    
    let updated = false;
    
    // First try updating using sizeVariants structure (new structure)
    if (Array.isArray(product.sizeVariants)) {
      const sizeVariant = product.sizeVariants.find((sv: any) => sv.size === size);
      
      if (sizeVariant && Array.isArray(sizeVariant.colorVariants)) {
        const colorVariant = sizeVariant.colorVariants.find((cv: any) => cv.color === color);
        
        if (colorVariant) {
          result.previousQuantity = colorVariant.stock;
          result.newQuantity = Math.max(0, colorVariant.stock - quantity);
          
          // Update the stock
          const updateResult = await db.collection('products').updateOne(
            { 
              _id: new ObjectId(productId),
              "sizeVariants.size": size,
              "sizeVariants.colorVariants.color": color
            },
            { 
              $inc: { 
                "sizeVariants.$[sizeElem].colorVariants.$[colorElem].stock": -Math.min(quantity, colorVariant.stock)
              } 
            },
            {
              arrayFilters: [
                { "sizeElem.size": size },
                { "colorElem.color": color }
              ]
            }
          );
          
          updated = updateResult.modifiedCount > 0;
        }
      }
    }
    
    // If update using sizeVariants failed, try using inventory.variants (old structure)
    if (!updated && product.inventory && Array.isArray(product.inventory.variants)) {
      const variantIndex = product.inventory.variants.findIndex(
        (v: any) => v.size === size && (v.color === color || !v.color || v.color === '')
      );
      
      if (variantIndex >= 0) {
        const currentQty = product.inventory.variants[variantIndex].quantity || 0;
        result.previousQuantity = currentQty;
        result.newQuantity = Math.max(0, currentQty - quantity);
        
        // Update product inventory
        const updateResult = await db.collection('products').updateOne(
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
              [`inventory.variants.${variantIndex}.quantity`]: result.newQuantity
            }
          }
        );
        
        updated = updateResult.modifiedCount > 0;
        
        // Recalculate total inventory
        if (updated) {
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
        }
      }
    }
    
    result.success = updated;
    
    if (!updated) {
      result.error = 'Failed to update inventory - variant not found';
    }
    
    // Log inventory change
    await logInventoryChange(result);
    return result;
    
  } catch (error: any) {
    result.error = `Error updating inventory: ${error.message}`;
    await logInventoryChange(result);
    return result;
  }
}

// Process inventory updates for an entire order
export async function updateInventoryFromOrder(orderId: string, forceUpdate: boolean = false) {
  try {
    const db = await getDb();
    
    // Find the order
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    // Check if the order has products
    if (!Array.isArray(order.products) || order.products.length === 0) {
      return { success: false, error: 'Order has no products' };
    }
    
    const results = [];
    const errors = [];
    const transactionId = `order_${orderId}_${Date.now()}`;
    
    // Process each product in the order
    for (const product of order.products) {
      // Skip already updated products unless force update is enabled
      if (product.inventoryUpdated && !forceUpdate) {
        continue;
      }
      
      // Extract product info
      const productId = product.productId || product.id;
      const size = product.size || 'default';
      const color = product.color || product.variant || 'default';
      const quantity = product.quantity || 1;
      
      if (!productId) {
        errors.push(`Missing product ID for order item`);
        continue;
      }
      
      try {
        // Update inventory
        const result = await reduceInventory({
          productId,
          size,
          color,
          quantity,
          transactionId: `${transactionId}_${productId}_${size}_${color}`
        });
        
        if (result.success) {
          results.push(result);
        } else {
          errors.push({ productId, error: result.error });
        }
      } catch (error: any) {
        errors.push({ productId, error: error.message });
      }
    }
    
    // Mark products as updated in the order
    if (results.length > 0) {
      // Create a deep copy of order.products to avoid reference issues
      const updatedOrderProducts = JSON.parse(JSON.stringify(order.products));
      
      // Mark each updated product
      for (const product of updatedOrderProducts) {
        const productId = product.productId || product.id;
        const size = product.size || 'default';
        const color = product.color || product.variant || 'default';
        
        // Find if this product was updated
        const isUpdated = results.some(
          updatedProduct => 
            updatedProduct.productId === productId && 
            updatedProduct.size === size && 
            updatedProduct.color === color
        );
        
        if (isUpdated) {
          product.inventoryUpdated = true;
        }
      }
      
      // Update the order
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { 
            products: updatedOrderProducts,
            inventoryUpdatedAt: new Date()
          } 
        }
      );
    }
    
    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      transactionId
    };
    
  } catch (error: any) {
    return { 
      success: false, 
      error: `Failed to update inventory: ${error.message}` 
    };
  }
} 