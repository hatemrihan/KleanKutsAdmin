import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { sendAdminNotification } from '@/app/utils/notifications';

// Type definitions
interface ApplicationData {
  email: string;
  name: string;
  applicationRef?: string;
  formData?: any;
  message?: string;
}

interface OrderData {
  orderId: string;
  referralCode: string;
  amount: number;
}

// POST /api/notifications - Handle notifications from the main site
export async function POST(request: NextRequest) {
  try {
    // Basic security check using shared secret
    // In production, implement proper authentication
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.SHARED_API_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401 }
      );
    }
    
    // Parse notification payload
    const { 
      type, 
      data,
      timestamp = new Date().toISOString()
    } = await request.json();
    
    // Validate payload
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }
    
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Process based on notification type
    switch (type) {
      case 'ambassador_application':
        await handleAmbassadorApplication(data as ApplicationData);
        break;
        
      case 'ambassador_application_error':
        await logApplicationError(data as ApplicationData);
        break;
        
      case 'order_completed':
        await handleOrderCompletion(data as OrderData);
        break;
        
      default:
        console.warn(`Unhandled notification type: ${type}`);
        // Still acknowledge receipt
        return NextResponse.json(
          { status: 'warning', message: `Unrecognized notification type: ${type}` },
          { status: 200 }
        );
    }
    
    // Log notification for audit purposes
    console.log(`Notification processed: ${type} at ${timestamp}`);
    
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

// Process new ambassador applications
async function handleAmbassadorApplication(data: ApplicationData) {
  const { email, name, applicationRef, formData } = data;
  
  try {
    // Check if application already exists
    const existingAmbassador = await Ambassador.findOne({ email });
    
    if (existingAmbassador) {
      // Update existing application data
      existingAmbassador.application = formData;
      existingAmbassador.applicationRef = applicationRef || existingAmbassador.applicationRef;
      existingAmbassador.applicationDate = new Date();
      existingAmbassador.status = 'pending';
      await existingAmbassador.save();
    } else {
      // Create new ambassador application
      const ambassador = new Ambassador({
        name,
        email,
        userId: `temp-${Date.now()}`,
        status: 'pending',
        reason: formData?.motivation || 'Application via form',
        application: formData,
        applicationDate: new Date(),
        applicationRef: applicationRef
      });
      
      await ambassador.save();
    }
    
    // Notify admins about the new application
    await sendAdminNotification({
      title: 'New Ambassador Application',
      message: `${name} (${email}) has submitted a new ambassador application.`,
      type: 'ambassador_application',
      data: { applicationRef, email, name }
    });
  } catch (error) {
    console.error('Error handling ambassador application:', error);
    throw error;
  }
}

// Log application errors for troubleshooting
async function logApplicationError(data: ApplicationData) {
  console.error('Ambassador application error:', data);
  
  // Notify admins about the error
  await sendAdminNotification({
    title: 'Ambassador Application Error',
    message: `Error processing application: ${data.message || 'Unknown error'}`,
    type: 'application_error',
    data
  });
}

// Process order notifications with ambassador codes
async function handleOrderCompletion(data: OrderData) {
  const { orderId, referralCode, amount } = data;
  
  try {
    // Find the ambassador by referral code
    const ambassador = await Ambassador.findOne({ 
      referralCode: referralCode 
    });
    
    if (!ambassador) {
      console.warn(`No ambassador found for referral code: ${referralCode}`);
      return;
    }
    
    // Calculate commission
    const commission = amount * ambassador.commissionRate;
    
    // Update ambassador statistics
    ambassador.sales += amount;
    ambassador.earnings += commission;
    ambassador.orders += 1;
    ambassador.paymentsPending += commission;
    
    // Add to recent orders
    ambassador.recentOrders.push({
      orderId,
      orderDate: new Date(),
      amount,
      commission,
      isPaid: false
    });
    
    // Keep only the most recent orders (limit to 20)
    if (ambassador.recentOrders.length > 20) {
      ambassador.recentOrders = ambassador.recentOrders.slice(-20);
    }
    
    await ambassador.save();
    
    // Notify admin
    await sendAdminNotification({
      title: 'New Ambassador Sale',
      message: `Order #${orderId} for $${amount} was completed using ambassador ${ambassador.name}'s code`,
      type: 'ambassador_sale',
      data: { 
        orderId, 
        ambassadorId: ambassador._id,
        ambassadorName: ambassador.name,
        amount,
        commission 
      }
    });
  } catch (error) {
    console.error('Error handling order completion:', error);
    throw error;
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
} 