import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { sendNotification } from '@/app/utils/notifications';

// Configure CORS middleware - more permissive during development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins during testing
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Handle direct ambassador applications from the e-commerce site
export async function POST(request: NextRequest) {
  try {
    // Log the incoming request for debugging
    console.log('Ambassador application received');
    
    // Basic security check using shared secret - making this more flexible during testing
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.SHARED_API_SECRET;
    
    // Log auth info (remove in production)
    console.log(`Auth header present: ${!!authHeader}`);
    console.log(`Expected token present: ${!!expectedToken}`);
    
    // More flexible auth during development
    if (expectedToken && authHeader) {
      if (!authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedToken) {
        console.log('Auth token mismatch');
        return NextResponse.json(
          { error: 'Unauthorized request' },
          { status: 401, headers: corsHeaders }
        );
      }
    }
    
    // Parse request body
    const formData = await request.json();
    console.log('Form data received:', formData);
    
    // Validate required fields - being more flexible with field names
    const email = formData.email || formData.emailAddress || formData.userEmail;
    const fullName = formData.fullName || formData.name || formData.userName;
    
    if (!email || !fullName) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields (email or fullName)' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      console.log('Connecting to MongoDB');
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Check if user already has applied
    console.log(`Checking for existing application with email: ${email}`);
    const existingApplication = await Ambassador.findOne({ email });
    
    if (existingApplication && existingApplication.status !== 'rejected') {
      console.log('Application already exists');
      return NextResponse.json(
        { error: 'An application with this email already exists', status: existingApplication.status },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Generate a unique reference for this application
    const applicationRef = `APP-${Date.now().toString(36).toUpperCase()}`;
    console.log(`Generated application reference: ${applicationRef}`);
    
    // Create or update ambassador application
    console.log('Creating or updating ambassador application');
    const ambassador = existingApplication || new Ambassador({
      email,
      name: fullName,
      userId: `temp-${Date.now()}`, // Temporary userId until properly connected to an account
      status: 'pending',
      reason: formData.motivation || formData.reason || 'Application via form',
      application: formData,
      applicationDate: new Date(),
      applicationRef: applicationRef
    });
    
    // If updating a rejected application
    if (existingApplication) {
      console.log('Updating existing application');
      existingApplication.application = formData;
      existingApplication.applicationRef = applicationRef;
      existingApplication.applicationDate = new Date();
      existingApplication.status = 'pending';
      await existingApplication.save();
    } else {
      console.log('Saving new application');
      await ambassador.save();
    }
    
    // Send notification to admin system
    try {
      console.log('Sending admin notification');
      await sendNotification({
        type: 'ambassador_application',
        title: 'New Ambassador Application',
        message: `New application from ${fullName} (${email})`,
        data: {
          email,
          name: fullName,
          applicationRef
        }
      });
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
      // Continue processing even if notification fails
    }
    
    // Return success response with CORS headers
    console.log('Application processed successfully');
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      reference: applicationRef
    }, { 
      status: 201, 
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('Error processing ambassador application:', error);
    return NextResponse.json(
      { error: 'Failed to process application: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log('CORS preflight request received');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Add a GET method for testing that the endpoint is reachable
export async function GET() {
  return NextResponse.json(
    { status: 'online', message: 'Ambassador application API is running' },
    { status: 200, headers: corsHeaders }
  )
} 