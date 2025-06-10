import { NextRequest, NextResponse } from 'next/server';
import { Product } from "../../models/product";
import { mongooseConnect } from "../../lib/mongoose";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { addToBlacklist } from '../../utils/updateBlacklist';
import { responseWithCors, handleCorsOptions } from '../../../lib/cors';

interface ProductQuery {
  deleted?: { $ne: boolean };
  createdAt?: {
    $gte: Date;
    $lte: Date;
  };
}

interface ColorVariant {
  color: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface ProductData {
  title: string;
  name?: string; // Will be set from title if not provided
  price: number;
  selectedImages: string[];
  categories?: string[];
  description?: string;
  properties?: Record<string, string[]>;
  sizeVariants?: SizeVariant[];
  selectedSizes?: string[];
  stock?: number;
  color?: string;
  discount?: number;
  discountType?: string;
  gender?: string;
}

// GET all products or single product
export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const month = searchParams.get('month');
    
    // If ID is provided, get single product
    if (id) {
      const client = await clientPromise;
      const db = client.db();
      const product = await db.collection('products').findOne({
        _id: new ObjectId(id)
      });

      if (!product) {
        return responseWithCors(
          { error: 'Product not found' },
          404,
          req
        );
      }

      // Calculate comprehensive stock status
      const stockStatus = calculateStockStatus(product);
      
      // Add stock status to product response
      const enhancedProduct = {
        ...product,
        stockStatus,
        // Legacy compatibility
        hasStock: stockStatus.hasStock,
        totalStock: stockStatus.totalStock,
        isOutOfStock: !stockStatus.hasStock
      };

      return responseWithCors(enhancedProduct, 200, req);
    }
    
    // Otherwise get all products
    let query: ProductQuery = { deleted: { $ne: true } };
    
    if (month) {
      // Map month name to month index (Jan=0, Feb=1, etc.)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex !== -1) {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, monthIndex, 1);
        const endDate = new Date(currentYear, monthIndex + 1, 0); // Last day of the month
        
        console.log(`Filtering products for ${month} ${currentYear}:`, startDate, 'to', endDate);
        
        query = {
          ...query,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else {
        console.log(`Invalid month: ${month}`);
      }
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // Enhance each product with stock status
    const enhancedProducts = products.map(product => {
      const stockStatus = calculateStockStatus(product);
      return {
        ...product.toObject(),
        stockStatus,
        hasStock: stockStatus.hasStock,
        totalStock: stockStatus.totalStock,
        isOutOfStock: !stockStatus.hasStock
      };
    });
    
    return responseWithCors(enhancedProducts, 200, req);
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return responseWithCors(
      { error: 'Failed to fetch products' },
      500,
      req
    );
  }
}

// Helper function to calculate comprehensive stock status
function calculateStockStatus(product: any) {
  let totalStock = 0;
  let hasStock = false;
  const variantDetails = [];

  // Check sizeVariants first (new structure)
  if (product.sizeVariants && Array.isArray(product.sizeVariants)) {
    for (const sizeVariant of product.sizeVariants) {
      if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
        for (const colorVariant of sizeVariant.colorVariants) {
          const stock = colorVariant.stock || 0;
          totalStock += stock;
          
          variantDetails.push({
            size: sizeVariant.size,
            color: colorVariant.color,
            stock: stock
          });
          
          if (stock > 0) {
            hasStock = true;
          }
        }
      }
    }
  }
  
  // Fallback to legacy stock field if no variants
  if (totalStock === 0 && product.stock && typeof product.stock === 'number') {
    totalStock = product.stock;
    hasStock = product.stock > 0;
  }
  
  // Fallback to stockInfo array if available
  if (totalStock === 0 && product.stockInfo && Array.isArray(product.stockInfo)) {
    for (const stockItem of product.stockInfo) {
      const stock = stockItem.quantity || 0;
      totalStock += stock;
      
      if (stock > 0) {
        hasStock = true;
      }
    }
  }

  return {
    hasStock,
    totalStock,
    variantDetails,
    status: hasStock ? 'in-stock' : 'out-of-stock',
    lastCalculated: new Date().toISOString()
  };
}

// POST new product
export async function POST(req: Request) {
  try {
    await mongooseConnect();
    const data: ProductData = await req.json();

    console.log('Received product creation data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.title?.trim()) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }
    if (!data.price || data.price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }
    if (!data.selectedImages?.length) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Prepare product data with required fields
    const productData = {
      ...data,
      name: data.title, // Ensure name field is set from title
      categories: data.categories || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating product with processed data:', JSON.stringify(productData, null, 2));

    // Create the product
    const product = await Product.create(productData);

    console.log('Product created successfully:', product._id);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error in POST /api/products:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create product: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    
    // Prepare update data - ensure proper handling of size variants
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Log the update operation for debugging
    console.log('Updating product with ID:', id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    try {
      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      console.log('Update result:', result);

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Product updated successfully' });
    } catch (dbError: any) {
      console.error('Database error during update:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in PUT /api/products:', error);
    return NextResponse.json(
      { error: `Failed to update product: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE product (soft or permanent)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // First, check if the product exists and get its details
    // We'll need this for cart cleanup
    const product = await db.collection('products').findOne({
      _id: new ObjectId(id)
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Add the product ID to the blacklist to prevent cart errors
    try {
      await addToBlacklist(id);
    } catch (blacklistError) {
      console.error('Error adding product to blacklist:', blacklistError);
      // Continue with deletion even if blacklist update fails
    }

    if (permanent) {
      // Permanent deletion
      const result = await db.collection('products').deleteOne({
        _id: new ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Product permanently deleted successfully',
        blacklisted: true
      });
    } else {
      // Soft delete (move to recycle bin)
      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            deleted: true,
            deletedAt: new Date().toISOString()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Product moved to recycle bin successfully',
        blacklisted: true
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// PATCH restore product
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { 
          deleted: "",
          deletedAt: ""
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product restored successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to restore product' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
} 