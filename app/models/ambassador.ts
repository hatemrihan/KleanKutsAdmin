import mongoose, { Schema } from 'mongoose';

const AmbassadorSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  referralCode: { 
    type: String,
    unique: true,
    sparse: true // allows null/undefined values to not trigger unique constraint
  },
  referralLink: { 
    type: String 
  },
  couponCode: { 
    type: String,
    unique: true,
    sparse: true
  },
  discountPercent: {
    type: Number,
    default: 10 // Default 10% discount for coupon codes
  },
  commissionRate: {
    type: Number,
    default: 0.10 // 10% by default
  },
  reason: {
    type: String,
    required: true // why they want to be an ambassador
  },
  // Application data from form submission
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
  // Statistics
  sales: { 
    type: Number, 
    default: 0 
  },
  earnings: { 
    type: Number, 
    default: 0 
  },
  referrals: { 
    type: Number, 
    default: 0 
  },
  orders: { 
    type: Number, 
    default: 0 
  },
  conversions: { 
    type: Number, 
    default: 0 
  },
  // Payment tracking
  paymentsPending: { 
    type: Number, 
    default: 0 
  },
  paymentsPaid: { 
    type: Number, 
    default: 0 
  },
  recentOrders: [{
    orderId: String,
    orderDate: Date,
    amount: Number,
    commission: Number,
    isPaid: { type: Boolean, default: false }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update timestamps before saving
AmbassadorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate referral code based on name if not already set
AmbassadorSchema.pre('save', function(next) {
  if (this.isNew || !this.referralCode) {
    const nameBase = this.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    const random = Math.floor(Math.random() * 90 + 10); // two digit number
    this.referralCode = `${nameBase}${random}`;
    
    // Generate full referral link
    this.referralLink = `https://elevee.netlify.app?ref=${this.referralCode}`;
  }
  next();
});

// For TypeScript compatibility
interface AmbassadorDocument extends mongoose.Document {
  email: string;
  name: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  referralCode?: string;
  referralLink?: string;
  couponCode?: string;
  discountPercent: number;
  commissionRate: number;
  reason: string;
  application?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    instagramHandle: string;
    tiktokHandle: string;
    otherSocialMedia: string;
    personalStyle: string;
    soldBefore: string;
    promotionPlan: string;
    investmentOption: string;
    contentComfort: string;
    instagramFollowers: string;
    tiktokFollowers: string;
    otherFollowers: string;
    targetAudience: string;
    otherAudience: string;
    motivation: string;
    hasCamera: string;
    attendEvents: string;
    agreeToTerms: string;
    additionalInfo: string;
    questions: string;
  };
  applicationDate?: Date;
  applicationRef?: string;
  reviewDate?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  sales: number;
  earnings: number;
  referrals: number;
  orders: number;
  conversions: number;
  paymentsPending: number;
  paymentsPaid: number;
  recentOrders: {
    orderId: string;
    orderDate: Date;
    amount: number;
    commission: number;
    isPaid: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Prevent duplicate model compilation error in development
export const Ambassador = mongoose.models.Ambassador || 
  mongoose.model<AmbassadorDocument>('Ambassador', AmbassadorSchema); 