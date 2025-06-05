import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '../../../lib/mongodb';
import Waitlist from '../../../lib/models/Waitlist';
import mongoose from 'mongoose';

// Simple interface that matches our data structure
interface RawWaitlistEntry {
  _id: unknown;
  email?: string;
  userEmail?: string;
  status?: string;
  waitlistStatus?: string;
  source?: string;
  platform?: string;
  notes?: string;
  comments?: string;
  createdAt?: string;
}

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
  const allowedOrigins = [
    'https://elevee.netlify.app',
    'https://elevee-store.netlify.app',
    'http://localhost:3000'
  ];
  
  const requestOrigin = headers().get('origin') || '';
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// Get all waitlist entries
export async function GET() {
  try {
    logInfo('Starting GET request');
    await connectToDatabase();
    
    // Try to get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get entries from the waitlists collection
    const collection = db.collection('waitlists');
    const waitlistEntries = await collection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Process and clean the entries
    const processedEntries = waitlistEntries.map(entry => ({
      _id: (entry._id as mongoose.Types.ObjectId).toString(),
      email: entry.email || entry.userEmail || '',
      status: entry.status || entry.waitlistStatus || 'pending',
      source: entry.source || entry.platform || 'website',
      notes: entry.notes || entry.comments || '',
      createdAt: entry.createdAt || new Date().toISOString()
    }));

    logInfo(`Returning ${processedEntries.length} processed entries`);
    return NextResponse.json(processedEntries);
  } catch (error) {
    logError('Failed to fetch waitlist entries', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist entries' }, { status: 500 });
  }
}

// Add new waitlist entry
export async function POST(req: NextRequest) {
  try {
    logInfo('Processing POST request');
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    logInfo('Request headers', headers);
    
    let email = '';
    let source = 'website';
    let notes = '';
    
    const contentType = req.headers.get('content-type') || '';
    logInfo('Content-Type', { contentType });
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      logInfo('Request body', body);
      email = body.email;
      source = body.source || 'website';
      notes = body.notes || '';
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
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
      const text = await req.text();
      logInfo('Raw request body', { text });
      try {
        const jsonData = JSON.parse(text);
        logInfo('Parsed JSON from text', jsonData);
        email = jsonData.email || '';
        source = jsonData.source || 'website';
        notes = jsonData.notes || '';
      } catch (jsonError) {
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
    
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if email already exists
    const collection = db.collection('waitlists');
    const existing = await collection.findOne({ email });
    
    if (existing) {
      logInfo('Email already exists in waitlist', { email });
      return NextResponse.json(
        { message: 'Email already in waitlist', exists: true },
        { status: 200, headers: corsHeaders() }
      );
    }
    
    // Create new waitlist entry
    const waitlistEntry = await collection.insertOne({
      email,
      source,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    logInfo('Successfully created waitlist entry', { id: waitlistEntry.insertedId });
    
    return NextResponse.json({
      message: 'Successfully added to waitlist',
      waitlistEntry
    }, { status: 201, headers: corsHeaders() });
  } catch (error: any) {
    logError('Error adding to waitlist', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist', details: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Add DELETE method
export async function DELETE(req: NextRequest) {
  try {
    logInfo('Starting DELETE request');
    await connectToDatabase();
    
    // Parse the request body
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders() });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Try to delete from all possible collections
    const collections = ['waitlist', 'waitlists', 'subscribers'];
    let deleted = false;

    for (const collName of collections) {
      try {
        if (await db.listCollections({ name: collName }).hasNext()) {
          const collection = db.collection(collName);
          const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
          
          if (result.deletedCount > 0) {
            logInfo(`Successfully deleted entry from ${collName}`);
            deleted = true;
            break;
          }
        }
      } catch (err) {
        logError(`Error deleting from ${collName}`, err);
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    logError('Failed to delete waitlist entry', error);
    return NextResponse.json(
      { error: 'Failed to delete waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Add PUT method for updating status and notes
export async function PUT(req: NextRequest) {
  try {
    logInfo('Starting PUT request');
    await connectToDatabase();
    
    // Parse the request body
    const body = await req.json();
    const { id, status, notes } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders() });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Prepare update object
    const updateObj: { status?: string; notes?: string } = {};
    if (status) updateObj.status = status;
    if (notes !== undefined) updateObj.notes = notes;

    // Try to update in all possible collections
    const collections = ['waitlist', 'waitlists', 'subscribers'];
    let updated = false;

    for (const collName of collections) {
      try {
        if (await db.listCollections({ name: collName }).hasNext()) {
          const collection = db.collection(collName);
          const result = await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: updateObj }
          );
          
          if (result.matchedCount > 0) {
            logInfo(`Successfully updated entry in ${collName}`);
            updated = true;
            break;
          }
        }
      } catch (err) {
        logError(`Error updating in ${collName}`, err);
      }
    }

    if (!updated) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    logError('Failed to update waitlist entry', error);
    return NextResponse.json(
      { error: 'Failed to update waitlist entry' },
      { status: 500, headers: corsHeaders() }
    );
  }
}