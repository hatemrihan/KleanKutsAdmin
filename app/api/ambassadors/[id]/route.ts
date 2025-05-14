import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// GET /api/ambassadors/[id] - Get ambassador by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ambassador ID is required' },
        { status: 400 }
      );
    }
    
    const ambassador = await Ambassador.findById(id);
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ambassador }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ambassador:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ambassador' },
      { status: 500 }
    );
  }
}

// PATCH /api/ambassadors/[id] - Update ambassador details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { id } = params;
    const updateData = await request.json();
    
    // Prevent updating certain fields directly for security
    const { _id, userId, email, ...safeUpdateData } = updateData;
    
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      safeUpdateData,
      { new: true }
    );
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ambassador }, { status: 200 });
  } catch (error) {
    console.error('Error updating ambassador:', error);
    return NextResponse.json(
      { error: 'Failed to update ambassador' },
      { status: 500 }
    );
  }
} 