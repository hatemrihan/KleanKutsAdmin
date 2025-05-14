# Ambassador Application API Endpoint Implementation

## API Endpoint: `/api/ambassador/request`

This document provides technical specifications for implementing the ambassador application API endpoint.

## Request Structure

```javascript
// POST /api/ambassador/request
{
  // Basic user info from NextAuth
  name: string,
  email: string,
  
  // Complete form data object containing all fields
  formData: {
    fullName: string,
    phoneNumber: string,
    email: string,
    instagramHandle: string,
    tiktokHandle: string,
    otherSocialMedia: string,
    personalStyle: string,    // One of 4 predefined options
    soldBefore: string,       // 'Yes' or 'No'
    promotionPlan: string,    // Open text field
    investmentOption: string, // One of 3 predefined options
    contentComfort: string,   // One of 3 predefined options
    instagramFollowers: string,
    tiktokFollowers: string,
    otherFollowers: string,
    targetAudience: string,   // One of 4 predefined options
    otherAudience: string,    // Only filled if targetAudience is 'Other'
    motivation: string,       // Open text field
    hasCamera: string,        // 'Yes' or 'No'
    attendEvents: string,     // 'Yes', 'No' or 'Depends'
    agreeToTerms: string,     // 'Yes, I agree' or 'No, I need more information'
    additionalInfo: string,   // Open text field
    questions: string         // Open text field
  }
}
```

## Implementation Steps

### 1. Create the API Endpoint

Create a new file at `my-app/app/api/ambassador/request/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { sendEmail } from '@/app/utils/email'; // Create this utility or use existing one

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
        { error: 'An application with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create or update ambassador application
    const ambassador = existingApplication || new Ambassador({
      name,
      email,
      status: 'pending',
      applicationDate: new Date(),
      sales: 0,
      earnings: 0, 
      orders: 0,
      paymentsPending: 0,
      paymentsPaid: 0,
      commissionRate: 0.1, // Default value, can be updated on approval
      discountPercent: 10, // Default value, can be updated on approval
      recentOrders: []
    });
    
    // Save all form data fields
    ambassador.application = formData;
    
    // Generate a unique reference for this application
    ambassador.applicationRef = `APP-${Date.now().toString(36).toUpperCase()}`;
    
    // Save the application
    await ambassador.save();
    
    // Send email notification to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Ambassador Application',
      text: `A new ambassador application has been received from ${name} (${email}). 
             Reference: ${ambassador.applicationRef}. 
             Please review it in the admin dashboard.`
    });
    
    // Send confirmation email to applicant
    await sendEmail({
      to: email,
      subject: 'Your Ambassador Application Has Been Received',
      text: `Thank you for applying to our ambassador program. 
             Your application reference is: ${ambassador.applicationRef}. 
             We will review your application and get back to you soon.`
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      reference: ambassador.applicationRef
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing ambassador application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}
```

### 2. Update Ambassador Model

Update the Ambassador model (`my-app/app/models/ambassador.js`) to include new fields:

```javascript
import mongoose from 'mongoose';

const AmbassadorSchema = new mongoose.Schema({
  // Basic info
  name: String,
  email: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  },
  
  // Application data
  application: {
    fullName: String,
    phoneNumber: String,
    email: String,
    instagramHandle: String,
    tiktokHandle: String,
    otherSocialMedia: String,
    personalStyle: String,
    soldBefore: String,
    promotionPlan: String,
    investmentOption: String,
    contentComfort: String,
    instagramFollowers: String,
    tiktokFollowers: String,
    otherFollowers: String,
    targetAudience: String,
    otherAudience: String,
    motivation: String,
    hasCamera: String,
    attendEvents: String,
    agreeToTerms: String,
    additionalInfo: String,
    questions: String
  },
  
  // Application tracking
  applicationDate: Date,
  applicationRef: String,
  reviewDate: Date,
  reviewedBy: String,
  reviewNotes: String,
  
  // Referral tracking
  referralCode: String,
  couponCode: String,
  discountPercent: { type: Number, default: 10 },
  
  // Performance metrics
  sales: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0.1 },
  
  // Payment tracking
  paymentsPending: { type: Number, default: 0 },
  paymentsPaid: { type: Number, default: 0 },
  
  // Recent orders
  recentOrders: [{
    orderId: String,
    orderDate: Date,
    amount: Number,
    commission: Number,
    isPaid: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Pre-save hook to generate referral code if not exists when status becomes approved
AmbassadorSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.referralCode) {
    // Generate referral code based on name
    const namePart = this.name.substring(0, 3).toUpperCase();
    this.referralCode = `${namePart}${Math.floor(1000 + Math.random() * 9000)}`;
    
    // If no custom coupon code set, use referral code as coupon
    if (!this.couponCode) {
      this.couponCode = this.referralCode;
    }
  }
  next();
});

export const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', AmbassadorSchema);
```

## Testing the API

Use the following curl command or Postman to test the API:

```bash
curl -X POST https://your-admin-domain.com/api/ambassador/request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "formData": {
      "fullName": "Test User",
      "phoneNumber": "1234567890",
      "email": "test@example.com",
      "instagramHandle": "@testuser",
      "tiktokHandle": "@testtiktok",
      "otherSocialMedia": "",
      "personalStyle": "Casual",
      "soldBefore": "No",
      "promotionPlan": "I will share on my social media platforms",
      "investmentOption": "Option 1",
      "contentComfort": "Very comfortable",
      "instagramFollowers": "5000",
      "tiktokFollowers": "2000",
      "otherFollowers": "",
      "targetAudience": "Women 18-35",
      "otherAudience": "",
      "motivation": "I love the brand and want to share it",
      "hasCamera": "Yes",
      "attendEvents": "Yes",
      "agreeToTerms": "Yes, I agree",
      "additionalInfo": "",
      "questions": ""
    }
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "reference": "APP-KX7Z9Y"
}
``` 