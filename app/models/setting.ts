import mongoose, { Schema } from 'mongoose';

const SettingSchema = new Schema({
  key: { 
    type: String, 
    required: true,
    unique: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String
  }
});

// Update timestamp before saving
SettingSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// For TypeScript compatibility
interface SettingDocument extends mongoose.Document {
  key: string;
  value: any;
  description?: string;
  lastUpdated: Date;
  updatedBy?: string;
}

// Prevent duplicate model compilation error in development
export const Setting = mongoose.models.Setting || 
  mongoose.model<SettingDocument>('Setting', SettingSchema); 