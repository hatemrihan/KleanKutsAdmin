import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongoose';
import { getCategory, createCategory, updateCategory, deleteCategory } from '../../lib/handlers/categoryHandler';
import { Category } from '../../models/category';

interface CategoryQuery {
  deleted?: { $ne: boolean };
  createdAt?: {
    $gte: Date;
    $lte: Date;
  };
  isActive?: boolean;
}

// GET all categories or single category
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const month = searchParams.get('month');
    const activeOnly = searchParams.get('active') === 'true';
    
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
    
    // Filter by active status if requested
    if (activeOnly) {
      query.isActive = true;
    }
    
    if (month) {
      // Map month name to month index (Jan=0, Feb=1, etc.)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex !== -1) {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, monthIndex, 1);
        const endDate = new Date(currentYear, monthIndex + 1, 0); // Last day of the month
        
        console.log(`Filtering categories for ${month} ${currentYear}:`, startDate, 'to', endDate);
        
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
    
    // Sort by displayOrder (if it exists) and then by createdAt in descending order
    const categories = await Category.find(query).sort({ displayOrder: 1, createdAt: -1 });
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