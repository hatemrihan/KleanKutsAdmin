import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// Simple token verification - should be replaced with more secure method in production
async function verifyAuthToken(token: string): Promise<boolean> {
  const expectedToken = process.env.SHARED_API_SECRET;
  
  if (!expectedToken) {
    console.warn('SHARED_API_SECRET not set in environment variables');
    return false;
  }
  
  return token === expectedToken;
}

// POST /api/notifications - Handle notifications from the main site
export async function POST(request: NextRequest) {
  try {
    // Verify authentication token/request is from trusted source
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const isValidRequest = await verifyAuthToken(token);
    
    if (!isValidRequest) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 403 }
      );
    }
    
    // Parse notification payload
    const { 
      type, 
      data,
      timestamp = new Date().toISOString()
    } = await request.json();
    
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }
    
    // Process based on notification type
    switch (type) {
      case 'ambassador_application':
        // Handle new ambassador application notification
        await handleAmbassadorApplication(data);
        break;
        
      case 'order_completed':
        // Handle order completion with ambassador code
        await handleOrderCompletion(data);
        break;
        
      // Add more notification types as needed
      
      default:
        console.warn(`Unhandled notification type: ${type}`);
        return NextResponse.json(
          { status: 'warning', message: `Unrecognized notification type: ${type}` },
          { status: 200 }
        );
    }
    
    // Log notification for audit purposes
    console.log('Notification received:', {
      type,
      timestamp,
      data: JSON.stringify(data)
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Notification processed successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

// Helper functions for processing notifications
async function handleAmbassadorApplication(data: any) {
  // Ensure MongoDB connection
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
  }
  
  const { email, name, applicationDetails, applicationRef } = data;
  
  // Check if application already exists
  const existingApplication = await Ambassador.findOne({ email });
  
  if (existingApplication && existingApplication.status !== 'rejected') {
    console.log(`Application already exists for ${email}`);
    return;
  }
  
  // Create new ambassador application
  const ambassador = existingApplication || new Ambassador({
    name,
    email,
    status: 'pending',
    applicationDate: new Date(),
    applicationRef: applicationRef || `APP-${Date.now().toString(36).toUpperCase()}`,
    sales: 0,
    earnings: 0,
    orders: 0,
    paymentsPending: 0,
    paymentsPaid: 0,
    commissionRate: 0.1,
    discountPercent: 10,
    recentOrders: []
  });
  
  // Save application details
  ambassador.applicationDetails = applicationDetails;
  
  // Save to database
  await ambassador.save();
  
  console.log(`New ambassador application received from ${name} (${email})`);
}

async function handleOrderCompletion(data: any) {
  // Ensure MongoDB connection
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
  }
  
  const { orderId, ambassadorId, code, amount } = data;
  
  // Find the ambassador
  const ambassador = await Ambassador.findById(ambassadorId);
  
  if (!ambassador) {
    console.error(`Ambassador not found for ID: ${ambassadorId}`);
    return;
  }
  
  // Calculate commission
  const commission = amount * ambassador.commissionRate;
  
  // Update ambassador stats
  ambassador.sales = (ambassador.sales || 0) + amount;
  ambassador.earnings = (ambassador.earnings || 0) + commission;
  ambassador.orders = (ambassador.orders || 0) + 1;
  ambassador.paymentsPending = (ambassador.paymentsPending || 0) + commission;
  
  // Add to recent orders
  ambassador.recentOrders.push({
    orderId,
    orderDate: new Date(),
    amount,
    commission,
    isPaid: false
  });
  
  // Save changes
  await ambassador.save();
  
  console.log(`Order ${orderId} processed for ambassador ${ambassador.name}, commission: ${commission}`);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
} 