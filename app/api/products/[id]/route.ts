import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { addToBlacklist } from '@/app/utils/updateBlacklist';
import { recordProductChange } from '@/app/utils/cacheUtils';

// DELETE specific product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid product ID is required' },
        { status: 400 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    // Connect to MongoDB
    console.log(`Deleting product with ID: ${id}, permanent: ${permanent}`);
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // First, check if the product exists and get its details
    // We'll need this for cart cleanup
    const productObjectId = new ObjectId(id);
    const product = await db.collection('products').findOne({
      _id: productObjectId
    });

    if (!product) {
      console.log(`Product not found with ID: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Store product details for cache update and client response
    const productDetails = {
      title: product.title || 'Unknown Product',
      price: product.price,
      categories: product.categories || [],
      deletedAt: new Date().toISOString(),
      permanent
    };

    // Start MongoDB session for transaction
    const session = mongoose.connection.startSession ? await mongoose.connection.startSession() : null;
    let transactionSuccess = false;
    
    try {
      // Add the product ID to the blacklist to prevent cart errors
      await addToBlacklist(id);
      console.log(`Added product ${id} to blacklist`);
      
      if (session) {
        // With transaction support
        console.log(`Using transaction for deletion of product: ${id}`);
        session.startTransaction();
        
        if (permanent) {
          // Permanent deletion with transaction
          const result = await db.collection('products').deleteOne(
            { _id: productObjectId },
            { session }
          );
          
          if (result.deletedCount === 0) {
            throw new Error(`Failed to delete product ${id} with transaction`);
          }
        } else {
          // Soft delete with transaction
          const result = await db.collection('products').updateOne(
            { _id: productObjectId },
            { 
              $set: { 
                deleted: true,
                deletedAt: new Date().toISOString()
              } 
            },
            { session }
          );
          
          if (result.matchedCount === 0) {
            throw new Error(`Failed to soft delete product ${id} with transaction`);
          }
        }
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        transactionSuccess = true;
        console.log(`Transaction successful for product: ${id}`);
      } else {
        // Fallback without transaction support
        console.log(`No transaction support, using standard operations for product: ${id}`);
        
        if (permanent) {
          // Permanent deletion - make sure it's really gone
          console.log(`Performing permanent deletion for product: ${id}`);
          
          // First try deleteOne
          const result = await db.collection('products').deleteOne({
            _id: productObjectId
          });

          if (result.deletedCount === 0) {
            console.log(`No products deleted with deleteOne, trying findOneAndDelete`);
            
            // As a fallback, try findOneAndDelete which can be more reliable
            const alternativeResult = await db.collection('products').findOneAndDelete({
              _id: productObjectId
            });
            
            if (!alternativeResult || !alternativeResult.value) {
              console.log(`Product ${id} not found or could not be deleted`);
              return NextResponse.json(
                { success: false, error: 'Product not found or could not be deleted' },
                { status: 404 }
              );
            }
          }
          
          transactionSuccess = true;
        } else {
          // Soft delete (move to recycle bin)
          console.log(`Performing soft deletion (recycle bin) for product: ${id}`);
          const result = await db.collection('products').updateOne(
            { _id: productObjectId },
            { 
              $set: { 
                deleted: true,
                deletedAt: new Date().toISOString()
              } 
            }
          );

          if (result.matchedCount === 0) {
            console.log(`Product ${id} not found for soft deletion`);
            return NextResponse.json(
              { success: false, error: 'Product not found' },
              { status: 404 }
            );
          }
          
          transactionSuccess = true;
        }
      }
      
      // If we reached here with transactionSuccess, the operation was successful
      if (transactionSuccess) {
        // Record the product change in our cache system
        await recordProductChange('delete', id, productDetails);
      
        // Update product counts in cache to ensure they're accurate
        try {
          await db.collection('cache').updateOne(
            { key: 'product_counts' },
            { 
              $set: { 
                updatedAt: new Date().toISOString(),
                requiresRefresh: true
              } 
            },
            { upsert: true }
          );
        } catch (cacheError) {
          console.log('Could not update cache, not critical:', cacheError);
        }
        
        console.log(`Product ${id} ${permanent ? 'permanently deleted' : 'moved to recycle bin'} successfully`);
        return NextResponse.json({
          success: true,
          message: `Product ${permanent ? 'permanently deleted' : 'moved to recycle bin'} successfully`,
          blacklisted: true,
          productId: id,
          productDetails
        });
      } else {
        throw new Error('Transaction failed but no error was thrown');
      }
    } catch (operationError) {
      // If using transaction, abort it on error
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      
      console.error(`Error during product deletion operation:`, operationError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete product', details: (operationError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product', details: (error as Error).message },
      { status: 500 }
    );
  }
} 