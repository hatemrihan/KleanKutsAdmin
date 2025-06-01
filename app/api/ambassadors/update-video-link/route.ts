import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Ambassador } from '@/app/models/ambassador';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { email, productVideoLink } = await request.json();

    if (!email || !productVideoLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Update ambassador record
    const ambassador = await Ambassador.findOneAndUpdate(
      { email },
      { 
        $set: { 
          productVideoLink,
          videoSubmissionDate: new Date()
        }
      },
      { new: true }
    );

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Link updated successfully',
      ambassador
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating link:', error);
    return NextResponse.json({ 
      error: 'Failed to update link',
      details: error.message 
    }, { status: 500 });
  }
} 