import { NextRequest, NextResponse } from 'next/server';
import { Product } from "../../models/product";
import { mongooseConnect } from "../../lib/mongoose";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { addToBlacklist } from '../../utils/updateBlacklist';

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
  price: number;
  selectedImages: string[];
  categories?: string[];
  description?: string;
  properties?: Record<string, string[]>;
  sizeVariants?: SizeVariant[];
  selectedSizes?: string[];
  stock?: number;
  color?: string;
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
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(product);
    }
    
    // Otherwise get all products
    let query: ProductQuery = { deleted: { $ne: true } };
    
    if (month) {
      // Add month filtering
      const monthIndex = new Date(`${month} 1, 2024`).getMonth();
      const startDate = new Date(2024, monthIndex, 1);
      const endDate = new Date(2024, monthIndex + 1, 0);
      
      query = {
        ...query,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST new product
export async function POST(req: Request) {
  try {
    await mongooseConnect();
    const data: ProductData = await req.json();

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

    // Create the product
    const product = await Product.create({
      ...data,
      categories: data.categories || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
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