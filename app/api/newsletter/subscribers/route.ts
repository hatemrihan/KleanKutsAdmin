import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoose';
import Newsletter from '../../../models/newsletter';

// GET: Retrieve subscriber list with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source');
    const subscribed = searchParams.get('subscribed');
    const search = searchParams.get('search');
    
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
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Newsletter.countDocuments(query);
    
    // Get subscribers with pagination
    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      subscribers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/newsletter/subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter subscribers' },
      { status: 500 }
    );
  }
}

// POST: Export subscribers (TXT or CSV format)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { format = 'txt', source, subscribed } = body;
    
    // Build query based on params
    const query: any = {};
    
    if (source) {
      query.source = source;
    }
    
    if (subscribed === true) {
      query.subscribed = true;
    } else if (subscribed === false) {
      query.subscribed = false;
    }
    
    // Get all matching subscribers
    const subscribers = await Newsletter.find(query).sort({ subscribedAt: -1 });
    
    // Format response based on format parameter
    if (format.toLowerCase() === 'csv') {
      // Generate CSV content
      const headers = ['Email', 'Source', 'Subscribed', 'Subscribed At', 'Created At', 'Updated At'];
      const rows = subscribers.map(sub => [
        sub.email,
        sub.source,
        sub.subscribed ? 'Yes' : 'No',
        sub.subscribedAt ? new Date(sub.subscribedAt).toISOString() : '',
        sub.createdAt ? new Date(sub.createdAt).toISOString() : '',
        sub.updatedAt ? new Date(sub.updatedAt).toISOString() : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=newsletter_subscribers.csv'
        }
      });
    }
    
    // Default to TXT format
    const txtContent = subscribers.map(sub => {
      return [
        `Email: ${sub.email}`,
        `Source: ${sub.source}`,
        `Status: ${sub.subscribed ? 'Subscribed' : 'Unsubscribed'}`,
        `Subscribed At: ${sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString() : 'N/A'}`,
        `Created At: ${sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'}`,
        `Updated At: ${sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : 'N/A'}`,
        '----------------------------------------'
      ].join('\n');
    }).join('\n\n');
    
    return new NextResponse(txtContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=newsletter_subscribers.txt'
      }
    });
  } catch (error) {
    console.error('Error in POST /api/newsletter/subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to export newsletter subscribers' },
      { status: 500 }
    );
  }
} 