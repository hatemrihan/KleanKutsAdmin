import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../lib/mongodb';

export async function GET() {
  const diagnosticInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    mongoConnectionStatus: 'Not tested',
    mongoVersion: mongoose.version,
    connectionString: 'REDACTED',
    environmentVariables: {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set (redacted)' : 'Not set',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET ? 'Set' : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    },
    headers: {},
  };

  try {
    // Test MongoDB connection
    const client = await connectToDatabase();
    diagnosticInfo.mongoConnectionStatus = 'Connected';
    
    try {
      // Try to get server info
      const adminDb = client.db().admin();
      const serverInfo = await adminDb.serverInfo();
      diagnosticInfo.mongoServerInfo = {
        version: serverInfo.version,
        uptime: serverInfo.uptime,
      };
      
      // List databases
      const dbList = await adminDb.listDatabases({ nameOnly: true });
      diagnosticInfo.mongoDatabases = dbList.databases.map((db: any) => db.name);
    } catch (dbInfoError: any) {
      diagnosticInfo.mongoServerInfoError = dbInfoError.message;
    }
    
    // Check if we can perform a basic operation
    try {
      const testCollection = client.db().collection('diagnostic_tests');
      const testResult = await testCollection.insertOne({ 
        test: 'connection', 
        timestamp: new Date() 
      });
      diagnosticInfo.testWriteOperation = 'Success';
      diagnosticInfo.testWriteId = testResult.insertedId.toString();
      
      // Clean up after test
      await testCollection.deleteOne({ _id: testResult.insertedId });
    } catch (opError: any) {
      diagnosticInfo.testWriteOperation = 'Failed';
      diagnosticInfo.testWriteError = opError.message;
    }
  } catch (error: any) {
    diagnosticInfo.mongoConnectionStatus = 'Failed';
    diagnosticInfo.mongoConnectionError = error.message;
    
    // Provide more detailed info about the connection string
    if (process.env.MONGODB_URI) {
      try {
        const sanitizedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//USER:PASSWORD@');
        diagnosticInfo.connectionString = sanitizedUri;
        
        // Check if URI has proper format
        if (!sanitizedUri.startsWith('mongodb://') && !sanitizedUri.startsWith('mongodb+srv://')) {
          diagnosticInfo.connectionStringAnalysis = 'Invalid URI format - should start with mongodb:// or mongodb+srv://';
        } else if (sanitizedUri.includes('"') || sanitizedUri.includes("'")) {
          diagnosticInfo.connectionStringAnalysis = 'URI contains quotes that need to be removed';
        }
      } catch (uriError) {
        diagnosticInfo.connectionStringAnalysis = 'Error parsing connection string';
      }
    } else {
      diagnosticInfo.connectionStringAnalysis = 'MONGODB_URI environment variable is not set';
    }
  }

  return NextResponse.json(diagnosticInfo);
} 