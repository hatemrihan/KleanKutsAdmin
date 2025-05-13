import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import Waitlist from '../../../lib/models/Waitlist';
import mongoose from 'mongoose';

// Helper function for detailed logging
function logInfo(message: string, data?: any) {
  console.log(`[WAITLIST API] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper function for error logging
function logError(message: string, error: any) {
  console.error(`[WAITLIST API ERROR] ${message}:`, error);
  // Log the error type and message for debugging
  console.error(`Error type: ${error.name}, Message: ${error.message}`);
  if (error.stack) {
    console.error(`Stack trace: ${error.stack}`);
  }
}

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // In production, replace with specific frontend domain
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
    logInfo('Processing GET request', { url: req.url });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    logInfo('Connecting to database');
    await connectToDatabase();
    
    let query = {};
    if (status) {
      query = { status };
    }
    
    logInfo('Fetching waitlist entries', { query, limit, skip });
    const waitlistEntries = await Waitlist.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
      
    const total = await Waitlist.countDocuments(query);
    
    logInfo('Successfully fetched waitlist entries', { total, count: waitlistEntries.length });
    return NextResponse.json({
      waitlistEntries,
      total,
      limit,
      skip
    }, { headers: corsHeaders() });
  } catch (error) {
    logError('Error fetching waitlist entries', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist entries' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Add new waitlist entry
export async function POST(req: NextRequest) {
  try {
    logInfo('Processing POST request');
    // Log the request headers for debugging
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    logInfo('Request headers', headers);
    
    // Handle both JSON and form data submissions
    let email = '';
    let source = 'website';
    let notes = '';
    
    const contentType = req.headers.get('content-type') || '';
    logInfo('Content-Type', { contentType });
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      logInfo('Processing JSON request');
      const body = await req.json();
      logInfo('Request body', body);
      email = body.email;
      source = body.source || 'website';
      notes = body.notes || '';
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Handle form data
      logInfo('Processing form data request');
      try {
        const formData = await req.formData();
        logInfo('Form data entries', Array.from(formData.entries()));
        email = formData.get('email')?.toString() || '';
        source = formData.get('source')?.toString() || 'website';
        notes = formData.get('notes')?.toString() || '';
      } catch (formError) {
        logError('Error parsing form data', formError);
      }
    } else {
      // Try to parse URL-encoded body as a fallback
      logInfo('Attempting to parse raw request body');
      const text = await req.text();
      logInfo('Raw request body', { text });
      try {
        // Try to parse as JSON first in case content-type is wrong
        const jsonData = JSON.parse(text);
        logInfo('Parsed JSON from text', jsonData);
        email = jsonData.email || '';
        source = jsonData.source || 'website';
        notes = jsonData.notes || '';
      } catch (jsonError) {
        // If not JSON, try URL params
        logInfo('Not valid JSON, trying URL params');
        const params = new URLSearchParams(text);
        logInfo('URL params', Array.from(params.entries()));
        email = params.get('email') || '';
        source = params.get('source') || 'website';
        notes = params.get('notes') || '';
      }
    }
    
    logInfo('Extracted data', { email, source, notes });
    
    if (!email) {
      logInfo('Missing required email field');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    logInfo('Connecting to database');
    await connectToDatabase();
    
    // Check if email already exists
    logInfo('Checking if email already exists', { email });
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      logInfo('Email already exists in waitlist', { email });
      return NextResponse.json(
        { message: 'Email already in waitlist', exists: true },
        { status: 200, headers: corsHeaders() }
      );
    }
    
    // Create new waitlist entry
    logInfo('Creating new waitlist entry', { email, source });
    const waitlistEntry = await Waitlist.create({
      email,
      source,
      notes
    });
    
    logInfo('Successfully created waitlist entry', { id: waitlistEntry._id });
    
    // Determine the appropriate response format based on the request content type
    if (contentType.includes('application/json')) {
      return NextResponse.json({
        message: 'Successfully added to waitlist',
        waitlistEntry
      }, { status: 201, headers: corsHeaders() });
    } else {
      // For form submissions, redirect to success page or return simple HTML
      const successHtml = `
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=https://elevee.netlify.app/waitlist-success">
            <title>Successfully Added</title>
          </head>
          <body>
            <p>Successfully added to waitlist. Redirecting...</p>
            <script>
              window.location.href = 'https://elevee.netlify.app/waitlist-success';
            </script>
          </body>
        </html>
      `;
      
      return new NextResponse(successHtml, { 
        status: 201,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'text/html',
        }
      });
    }
  } catch (error: any) {
    logError('Error adding to waitlist', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist', details: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Update waitlist entry status
export async function PUT(req: NextRequest) {
  try {
    logInfo('Processing PUT request');
    const body = await req.json();
    logInfo('Request body', body);
    const { id, status, notes } = body;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      logInfo('Invalid or missing ID', { id });
      return NextResponse.json(
        { error: 'Valid waitlist entry ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    logInfo('Connecting to database');
    await connectToDatabase();
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    logInfo('Updating waitlist entry', { id, updateData });
    const updatedEntry = await Waitlist.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedEntry) {
      logInfo('Waitlist entry not found', { id });
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    logInfo('Successfully updated waitlist entry', { id });
    return NextResponse.json({
      message: 'Waitlist entry updated successfully',
      waitlistEntry: updatedEntry
    }, { headers: corsHeaders() });
  } catch (error) {
    logError('Error updating waitlist entry', error);
    return NextResponse.json(
      { error: 'Failed to update waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Delete waitlist entry
export async function DELETE(req: NextRequest) {
  try {
    logInfo('Processing DELETE request', { url: req.url });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      logInfo('Invalid or missing ID', { id });
      return NextResponse.json(
        { error: 'Valid waitlist entry ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    logInfo('Connecting to database');
    await connectToDatabase();
    
    logInfo('Deleting waitlist entry', { id });
    const deletedEntry = await Waitlist.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      logInfo('Waitlist entry not found', { id });
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    logInfo('Successfully deleted waitlist entry', { id });
    return NextResponse.json({
      message: 'Waitlist entry deleted successfully'
    }, { headers: corsHeaders() });
  } catch (error) {
    logError('Error deleting waitlist entry', error);
    return NextResponse.json(
      { error: 'Failed to delete waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 