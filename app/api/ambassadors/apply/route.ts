import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { sendNotification } from '@/app/utils/notifications';

// Configure CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://elevee.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle direct ambassador applications from the e-commerce site
export async function POST(request: NextRequest) {
  try {
    // Basic security check using shared secret
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.SHARED_API_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Parse request body
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.email || !formData.fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Check if user already has applied
    const existingApplication = await Ambassador.findOne({ email: formData.email });
    
    if (existingApplication && existingApplication.status !== 'rejected') {
      return NextResponse.json(
        { error: 'An application with this email already exists', status: existingApplication.status },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Generate a unique reference for this application
    const applicationRef = `APP-${Date.now().toString(36).toUpperCase()}`;
    
    // Create or update ambassador application
    const ambassador = existingApplication || new Ambassador({
      email: formData.email,
      name: formData.fullName,
      userId: `temp-${Date.now()}`, // Temporary userId until properly connected to an account
      status: 'pending',
      reason: formData.motivation || 'Application via form',
      application: formData,
      applicationDate: new Date(),
      applicationRef: applicationRef
    });
    
    // If updating a rejected application
    if (existingApplication) {
      existingApplication.application = formData;
      existingApplication.applicationRef = applicationRef;
      existingApplication.applicationDate = new Date();
      existingApplication.status = 'pending';
      await existingApplication.save();
    } else {
      await ambassador.save();
    }
    
    // Send notification to admin system
    try {
      await sendNotification({
        type: 'ambassador_application',
        title: 'New Ambassador Application',
        message: `New application from ${formData.fullName} (${formData.email})`,
        data: {
          email: formData.email,
          name: formData.fullName,
          applicationRef
        }
      });
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
      // Continue processing even if notification fails
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      reference: applicationRef
    }, { status: 201, headers: corsHeaders });
    
  } catch (error) {
    console.error('Error processing ambassador application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
} 