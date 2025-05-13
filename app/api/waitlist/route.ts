import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import Waitlist from '../../../lib/models/Waitlist';
import mongoose from 'mongoose';

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // In production, replace with your frontend domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// Get all waitlist entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    await connectToDatabase();
    
    let query = {};
    if (status) {
      query = { status };
    }
    
    const waitlistEntries = await Waitlist.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
      
    const total = await Waitlist.countDocuments(query);
    
    return NextResponse.json({
      waitlistEntries,
      total,
      limit,
      skip
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist entries' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Add new waitlist entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    await connectToDatabase();
    
    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return NextResponse.json(
        { message: 'Email already in waitlist', exists: true },
        { status: 200, headers: corsHeaders() }
      );
    }
    
    // Create new waitlist entry
    const waitlistEntry = await Waitlist.create({
      email,
      source: body.source || 'website',
      notes: body.notes || ''
    });
    
    return NextResponse.json({
      message: 'Successfully added to waitlist',
      waitlistEntry
    }, { status: 201, headers: corsHeaders() });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Update waitlist entry status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid waitlist entry ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    await connectToDatabase();
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    const updatedEntry = await Waitlist.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    return NextResponse.json({
      message: 'Waitlist entry updated successfully',
      waitlistEntry: updatedEntry
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    return NextResponse.json(
      { error: 'Failed to update waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Delete waitlist entry
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid waitlist entry ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    await connectToDatabase();
    
    const deletedEntry = await Waitlist.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    return NextResponse.json({
      message: 'Waitlist entry deleted successfully'
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error deleting waitlist entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 