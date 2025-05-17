import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoose';
import Newsletter from '../../../models/newsletter';

// POST: Unsubscribe from the newsletter
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find the subscriber
    const subscriber = await Newsletter.findOne({ email });
    
    if (!subscriber) {
      return NextResponse.json(
        { error: 'Email not found in newsletter list' },
        { status: 404 }
      );
    }
    
    // Update subscription status
    subscriber.subscribed = false;
    await subscriber.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Error in POST /api/newsletter/unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    );
  }
} 