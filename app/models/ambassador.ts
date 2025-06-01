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
  isActive: {
    type: Boolean,
    default: true
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
  recentOrders: {
    type: [{
      orderId: { type: String },
      orderDate: { type: Date, default: Date.now },
      amount: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      isPaid: { type: Boolean, default: false }
    }],
    default: []
  },
  // Update the video-related fields
  productVideoLink: { type: String },
  videoSubmissionDate: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for total earnings
AmbassadorSchema.virtual('totalEarnings').get(function() {
  return this.earnings || 0;
});

// Generate referral code based on name if not already set
AmbassadorSchema.pre('save', function(next) {
  // Generate referral code and referral link for all ambassadors
  if (this.isNew || !this.referralCode) {
    const nameBase = this.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    const random = Math.floor(Math.random() * 90 + 10); // two digit number
    this.referralCode = `${nameBase}${random}`;
  }
  
  // Always regenerate the referral link to ensure it's present and correct
  // Use the store URL from environment or fallback to default
  const storeUrl = process.env.STORE_URL || 'https://elevee.netlify.app';
  this.referralLink = `${storeUrl}?ref=${this.referralCode}`;
  
  // Ensure coupon code exists for approved ambassadors
  if (this.status === 'approved' && !this.couponCode) {
    this.couponCode = this.referralCode;
  }
  
  // Ensure isActive exists
  if (typeof this.isActive === 'undefined') {
    this.isActive = true;
  }
  
  next();
});

// For TypeScript compatibility
interface AmbassadorDocument extends mongoose.Document {
  email: string;
  name: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
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
  productVideoLink?: string;
  videoSubmissionDate?: Date;
}

// Helper function to fix missing isActive field on all ambassadors
export async function fixAllAmbassadorsActive() {
  if (mongoose.models.Ambassador) {
    try {
      const result = await mongoose.models.Ambassador.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
      );
      console.log('Fixed isActive field for ambassadors:', result);
      return result;
    } catch (error) {
      console.error('Error fixing ambassador active status:', error);
      throw error;
    }
  }
}

// Add index for faster queries
AmbassadorSchema.index({ email: 1, status: 1 });
AmbassadorSchema.index({ videoSubmissionDate: 1 });

// Export the model
export const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', AmbassadorSchema); 