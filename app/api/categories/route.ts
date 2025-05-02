import { NextRequest, NextResponse } from 'next/server';
import { getCategory, updateCategory, deleteCategory, createCategory } from '@/app/lib/handlers/categoryHandler';
import { connectToDatabase } from '@/lib/mongoose';
import { Category } from '@/app/models/category';

interface CategoryQuery {
  deleted?: { $ne: boolean };
  createdAt?: {
    $gte: Date;
    $lte: Date;
  };
}

// GET all categories or single category
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const month = searchParams.get('month');
    
    // If ID is provided, get single category
    if (id) {
      const { success, data, error } = await getCategory(id);
      if (!success) {
        return NextResponse.json({ error }, { status: 404 });
      }
      return NextResponse.json(data);
    }
    
    // Otherwise get all categories
    let query: CategoryQuery = { deleted: { $ne: true } };
    
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
    
    const categories = await Category.find(query).sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST new category
export async function POST(req: Request) {
  const body = await req.json();
  const { success, data, error } = await createCategory(body);
  
  if (!success) {
    return NextResponse.json({ error }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// PUT update category
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const result = await updateCategory(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/categories:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteCategory(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/categories:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 