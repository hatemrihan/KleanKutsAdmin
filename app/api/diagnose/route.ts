import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { mongooseConnect } from '../../lib/mongoose';

export async function GET() {
  try {
    // Check environment variables
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriFormat: process.env.MONGODB_URI ? 
                     (process.env.MONGODB_URI.startsWith('mongodb://') || 
                      process.env.MONGODB_URI.startsWith('mongodb+srv://') ? 
                      'Valid format' : 'Invalid format') : 
                     'Not available',
      currentConnectionState: mongoose.connection.readyState
    };
    
    console.log('Diagnostic endpoint called:', envInfo);
    
    // Try to connect
    let connectionResult = 'Not attempted';
    let connectionError = null;
    
    try {
      await mongooseConnect();
      connectionResult = 'Success';
    } catch (error: any) {
      connectionResult = 'Failed';
      connectionError = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }
    
    // Return diagnostic info
    return NextResponse.json({
      environment: envInfo,
      connection: {
        result: connectionResult,
        error: connectionError,
        readyState: mongoose.connection.readyState
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Diagnostic endpoint error:', error);
    
    return NextResponse.json({
      error: 'Diagnostic check failed',
      errorDetails: {
        message: error.message,
        name: error.name
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 