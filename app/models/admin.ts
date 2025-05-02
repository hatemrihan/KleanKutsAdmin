import mongoose, { Schema } from 'mongoose';

const adminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure the model hasn't been compiled before
export const Admin = mongoose.models?.Admin || mongoose.model('Admin', adminSchema); 