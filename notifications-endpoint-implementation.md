# Notifications Endpoint Implementation Guide

## Overview

This document provides implementation details for the `/api/notifications` endpoint on the admin site, which will receive updates from the main customer-facing site, particularly for ambassador applications.

## API Endpoint: `/api/notifications`

### Endpoint Implementation

Create a new file at `my-app/app/api/notifications/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyAuthToken } from '@/app/utils/auth'; // Create this utility
import { sendAdminNotification } from '@/app/utils/notifications'; // Create this utility

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
    await logNotification({
      type,
      timestamp,
      data: JSON.stringify(data),
      processed: true
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

// Helper functions

async function handleAmbassadorApplication(data) {
  // Ensure MongoDB connection
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
  }
  
  const { email, name, applicationRef } = data;
  
  // Notify admins about the new application
  await sendAdminNotification({
    title: 'New Ambassador Application',
    message: `${name} (${email}) has submitted a new ambassador application.`,
    type: 'ambassador_application',
    data: { applicationRef, email }
  });
  
  // You could also update dashboard counters, add to notifications center, etc.
}

async function handleOrderCompletion(data) {
  // Process order notifications that used ambassador codes
  const { orderId, ambassadorId, amount, code } = data;
  
  // Notify relevant admins
  await sendAdminNotification({
    title: 'New Order with Ambassador Code',
    message: `Order #${orderId} for $${amount} was completed using ambassador code: ${code}`,
    type: 'order_completion',
    data: { orderId, ambassadorId, amount }
  });
}

async function logNotification(notificationData) {
  // Ensure MongoDB connection
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
  }
  
  // Assuming you have a Notification model
  // const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
  // await Notification.create(notificationData);
  
  // For now, just log to console
  console.log('Notification received:', notificationData);
}
```

### Authentication Utility

Create a utility file at `my-app/app/utils/auth.ts` to validate incoming requests:

```typescript
// Validate tokens from the main app
export async function verifyAuthToken(token: string): Promise<boolean> {
  // For basic implementation, you can use a shared secret
  // In production, use proper JWT validation or other secure method
  
  const expectedToken = process.env.SHARED_API_SECRET;
  
  if (!expectedToken) {
    console.warn('SHARED_API_SECRET not set in environment variables');
    return false;
  }
  
  return token === expectedToken;
}
```

### Notification Utility

Create a utility file at `my-app/app/utils/notifications.ts` for sending admin notifications:

```typescript
import { AdminUser } from '@/app/models/adminUser'; // Adjust to your actual model

type NotificationData = {
  title: string;
  message: string;
  type: string;
  data: any;
};

// Send notifications to admin users
export async function sendAdminNotification(notification: NotificationData): Promise<void> {
  try {
    // Find admin users who should receive this notification
    // For now, notify all admins, but you could filter by role/permission
    const adminUsers = await AdminUser.find({}, 'email name');
    
    // Log for now
    console.log(`Sending notification to ${adminUsers.length} admins:`, notification);
    
    // In a real implementation, you might:
    // 1. Send emails to admins
    // 2. Store in an admin notifications collection
    // 3. Push via websockets if you have a real-time dashboard
    // 4. Send push notifications
    
    // Example: Store in notifications collection
    // await Notification.create({
    //   ...notification,
    //   createdAt: new Date(),
    //   readBy: []
    // });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}
```

## Environment Configuration

Add the following to your `.env` file:

```
# Shared secret for API authentication between sites
SHARED_API_SECRET=your-secure-random-string
```

Make sure both the main site and admin site use the same secret.

## Testing the Endpoint

You can test the endpoint using tools like Postman or curl:

```bash
curl -X POST https://eleveadmin.netlify.app/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-string" \
  -d '{
    "type": "ambassador_application",
    "data": {
      "email": "test@example.com",
      "name": "Test User",
      "applicationRef": "APP-123456"
    },
    "timestamp": "2023-06-15T12:00:00Z"
  }'
```

Expected response:

```json
{
  "status": "success",
  "message": "Notification processed successfully"
}
```

## Security Considerations

1. Always validate the authentication token
2. Consider rate limiting to prevent abuse
3. Log all notification attempts for audit purposes
4. Validate payload structure before processing
5. Consider implementing IP whitelisting for additional security 