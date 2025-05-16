import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoose';
import { Category } from '../../../models/category';

// GET active categories for the storefront
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Only fetch active and non-deleted categories
    const query = { 
      isActive: true,
      deleted: { $ne: true } 
    };
    
    // Sort by displayOrder (if it exists) and then by createdAt
    const categories = await Category.find(query).sort({ displayOrder: 1, createdAt: -1 });
    
    console.log(`Fetched ${categories.length} active categories for storefront`);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in GET /api/storefront/categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 