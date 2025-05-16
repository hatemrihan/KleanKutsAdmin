import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import { getCategory, updateCategory, deleteCategory } from '../../../lib/handlers/categoryHandler';

// GET single category
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    await mongooseConnect();
    const id = context.params.id;
    
    const { success, data, error } = await getCategory(id);
    
    if (!success) {
      return NextResponse.json({ error }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/categories/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT update category
export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id;
    const data = await req.json();
    
    const result = await updateCategory(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/categories/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(req: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id;
    
    const result = await deleteCategory(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/categories/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 