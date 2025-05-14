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
  
  // Application form data
  applicationDetails: {
    fullName: String,
    phoneNumber: String,
    email: String,
    instagramHandle: String,
    tiktokHandle: String,
    otherSocialMedia: String,
    personalStyle: String,    // One of 4 predefined options
    soldBefore: String,       // 'Yes' or 'No'
    promotionPlan: String,    // Open text field
    investmentOption: String, // One of 3 predefined options
    contentComfort: String,   // One of 3 predefined options
    instagramFollowers: String,
    tiktokFollowers: String,
    otherFollowers: String,
    targetAudience: String,   // One of 4 predefined options
    otherAudience: String,    // Only filled if targetAudience is 'Other'
    motivation: String,       // Open text field
    hasCamera: String,        // 'Yes' or 'No'
    attendEvents: String,     // 'Yes', 'No' or 'Depends'
    agreeToTerms: String,     // 'Yes, I agree' or 'No, I need more information'
    additionalInfo: String,   // Open text field
    questions: String         // Open text field
  },
  
  // Legacy application field (for backward compatibility)
  application: {
    type: Map,
    of: String
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

// Migration helper method to convert old application format to new applicationDetails format
AmbassadorSchema.methods.migrateApplicationData = function() {
  if (this.application && !this.applicationDetails) {
    this.applicationDetails = {
      fullName: this.application.fullName || this.name,
      email: this.application.email || this.email,
      phoneNumber: this.application.phoneNumber || '',
      instagramHandle: this.application.instagramHandle || '',
      // Add other fields as needed with defaults
    };
    return true;
  }
  return false;
};

export const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', AmbassadorSchema); 