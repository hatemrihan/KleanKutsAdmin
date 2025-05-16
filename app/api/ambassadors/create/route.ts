import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// POST /api/ambassadors/create - Create a new ambassador
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create a code from the name if not provided
    if (!data.code) {
      const nameBase = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
      const random = Math.floor(Math.random() * 9000) + 1000;
      data.code = `${nameBase}${random}`;
    }

    // Set default status to approved for admin-created ambassadors
    if (!data.status) {
      data.status = 'approved';
    }

    // Convert commission rate from percentage to decimal if needed
    if (data.commissionRate > 1) {
      data.commissionRate = data.commissionRate / 100;
    }

    // Create a new ambassador
    const ambassador = new Ambassador(data);
    await ambassador.save();
    
    return NextResponse.json(
      { 
        success: true,
        ambassador
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating ambassador:', error);

    // Check for duplicate key error (e.g., email already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An ambassador with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create ambassador' },
      { status: 500 }
    );
  }
} 