import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Ambassador } from '@/app/models/ambassador';

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ambassadorId, status } = await request.json();

    if (!ambassadorId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectToDatabase();

    const ambassador = await Ambassador.findByIdAndUpdate(
      ambassadorId,
      { 
        $set: { 
          videoStatus: status,
          videoReviewDate: new Date()
        }
      },
      { new: true }
    );

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found' }, { status: 404 });
    }

    // Send notification to ambassador about status update
    // TODO: Implement notification system

    return NextResponse.json({ 
      success: true,
      message: 'Video status updated successfully',
      ambassador
    });

  } catch (error: any) {
    console.error('Error updating video status:', error);
    return NextResponse.json({ 
      error: 'Failed to update video status',
      details: error.message 
    }, { status: 500 });
  }
} 