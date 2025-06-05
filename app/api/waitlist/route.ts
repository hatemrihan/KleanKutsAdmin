import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { mongooseConnect } from '../../lib/mongoose';
import { responseWithCors, handleCorsOptions } from '../../../lib/cors';
import Waitlist from '../../../lib/models/Waitlist';

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

// Handle OPTIONS requests for CORS preflight - CRITICAL FOR PRODUCTION
export async function OPTIONS(request: NextRequest) {
  console.log('[WAITLIST API] OPTIONS preflight request received');
  console.log('[WAITLIST API] Request origin:', request.headers.get('origin'));
  console.log('[WAITLIST API] Request method:', request.headers.get('access-control-request-method'));
  console.log('[WAITLIST API] Request headers:', request.headers.get('access-control-request-headers'));
  
  // Use the centralized CORS handler
  const response = handleCorsOptions(request);
  
  console.log('[WAITLIST API] Sending OPTIONS response with headers:', Object.fromEntries(response.headers.entries()));
  
  return response;
}

// Get all waitlist entries
export async function GET(request: NextRequest) {
  try {
    logInfo('Starting GET request from origin: ' + request.headers.get('origin'));
    await mongooseConnect();
    
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
    return responseWithCors(processedEntries, 200, request);
  } catch (error) {
    logError('Failed to fetch waitlist entries', error);
    return responseWithCors({ error: 'Failed to fetch waitlist entries' }, 500, request);
  }
}

// Add new waitlist entry - MAIN ENDPOINT FOR E-COMMERCE
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    logInfo('Processing POST request from origin: ' + origin);
    
    // Parse the JSON body
    const body = await req.json();
    logInfo('Request body', body);
    
    const email = body.email;
    const source = body.source || 'e-commerce';
    const notes = body.notes || '';
    
    if (!email) {
      logInfo('Missing required email field');
      return responseWithCors(
        { error: 'Email is required' },
        400,
        req
      );
    }
    
    await mongooseConnect();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if email already exists
    const collection = db.collection('waitlists');
    const existing = await collection.findOne({ email });
    
    if (existing) {
      logInfo('Email already exists in waitlist', { email });
      return responseWithCors(
        { 
          success: true,
          message: 'Email already in waitlist', 
          exists: true 
        },
        200,
        req
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
    
    const response = responseWithCors({
      success: true,
      message: 'Successfully added to waitlist',
      waitlistEntry: {
        _id: waitlistEntry.insertedId.toString(),
        email,
        source,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString()
      }
    }, 201, req);
    
    logInfo('Sending POST response with CORS headers');
    
    return response;
  } catch (error: any) {
    logError('Error adding to waitlist', error);
    return responseWithCors(
      { error: 'Failed to add to waitlist', details: error.message },
      500,
      req
    );
  }
}

// Add DELETE method
export async function DELETE(req: NextRequest) {
  try {
    logInfo('Starting DELETE request');
    await mongooseConnect();
    
    // Parse the request body
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return responseWithCors({ error: 'ID is required' }, 400, req);
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
      return responseWithCors({ error: 'Entry not found' }, 404, req);
    }

    return responseWithCors({ success: true }, 200, req);
  } catch (error) {
    logError('Failed to delete waitlist entry', error);
    return responseWithCors(
      { error: 'Failed to delete waitlist entry' },
      500,
      req
    );
  }
}

// Add PUT method for updating status and notes
export async function PUT(req: NextRequest) {
  try {
    logInfo('Starting PUT request');
    await mongooseConnect();
    
    // Parse the request body
    const body = await req.json();
    const { id, status, notes } = body;
    
    if (!id) {
      return responseWithCors({ error: 'ID is required' }, 400, req);
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Try to update in all possible collections
    const collections = ['waitlist', 'waitlists', 'subscribers'];
    let updated = false;

    for (const collName of collections) {
      try {
        if (await db.listCollections({ name: collName }).hasNext()) {
          const collection = db.collection(collName);
          
          const updateData: any = {};
          if (status) updateData.status = status;
          if (notes !== undefined) updateData.notes = notes;
          updateData.updatedAt = new Date().toISOString();

          const result = await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: updateData }
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
      return responseWithCors({ error: 'Entry not found' }, 404, req);
    }

    return responseWithCors({ success: true }, 200, req);
  } catch (error) {
    logError('Failed to update waitlist entry', error);
    return responseWithCors(
      { error: 'Failed to update waitlist entry' },
      500,
      req
    );
  }
}