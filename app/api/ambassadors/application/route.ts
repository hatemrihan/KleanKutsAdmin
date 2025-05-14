import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { sendNotification } from '@/app/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Parse request body
    const { name, email, formData } = await request.json();
    
    // Validate required fields
    if (!name || !email || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already has applied
    const existingApplication = await Ambassador.findOne({ email });
    
    if (existingApplication && existingApplication.status !== 'rejected') {
      return NextResponse.json(
        { error: 'An application with this email already exists', status: existingApplication.status },
        { status: 400 }
      );
    }
    
    // Create a new ambassador application or update rejected one
    const ambassador = existingApplication || new Ambassador({
      name,
      email,
      userId: `temp-${Date.now()}`, // Temporary userId, can be updated later
      status: 'pending',
      reason: formData.motivation || 'Application via form'
    });
    
    // Generate a unique reference for this application
    const applicationRef = `APP-${Date.now().toString(36).toUpperCase()}`;
    
    // Save all form data fields
    ambassador.application = formData;
    ambassador.applicationDate = new Date();
    ambassador.applicationRef = applicationRef;
    
    // Save the application
    await ambassador.save();
    
    // Send notification to admin
    try {
      await sendNotification({
        type: 'ambassador_application',
        title: 'New Ambassador Application',
        message: `New application from ${name} (${email})`,
        data: {
          email,
          name,
          applicationRef
        }
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Continue processing even if notification fails
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      reference: applicationRef
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing ambassador application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
} 