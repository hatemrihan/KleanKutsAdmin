import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongoose';
import Newsletter from '../../models/newsletter';

// GET: Count subscriptions with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const subscribed = searchParams.get('subscribed');
    
    // Build query based on params
    const query: any = {};
    
    if (source) {
      query.source = source;
    }
    
    if (subscribed === 'true') {
      query.subscribed = true;
    } else if (subscribed === 'false') {
      query.subscribed = false;
    }
    
    // Count documents
    const count = await Newsletter.countDocuments(query);
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error in GET /api/newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to count newsletter subscriptions' },
      { status: 500 }
    );
  }
}

// POST: Save email subscription
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { email, source = 'website_footer' } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existing = await Newsletter.findOne({ email });
    
    if (existing) {
      // If already subscribed, return success
      if (existing.subscribed) {
        return NextResponse.json({
          success: true,
          message: 'Email is already subscribed',
          alreadySubscribed: true
        });
      }
      
      // If unsubscribed, resubscribe
      existing.subscribed = true;
      existing.subscribedAt = new Date();
      existing.source = source;
      await existing.save();
      
      return NextResponse.json({
        success: true,
        message: 'Email has been resubscribed',
        resubscribed: true
      });
    }
    
    // Create new subscription
    const newsletter = new Newsletter({
      email,
      source,
      subscribed: true,
      subscribedAt: new Date()
    });
    
    await newsletter.save();
    
    return NextResponse.json({
      success: true,
      message: 'Email subscribed successfully',
      data: newsletter
    });
  } catch (error: any) {
    console.error('Error in POST /api/newsletter:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
} 