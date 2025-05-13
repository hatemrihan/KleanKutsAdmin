import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  oldPassword: { type: String }, // Store previous password for backwards compatibility
  passwordHistory: [{ type: String }], // Store previous passwords
  role: { type: String, enum: ['admin'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the updatedAt field
adminSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // If password is modified, ensure it's properly hashed
  if (this.isModified('password')) {
    // If the password isn't already hashed (doesn't start with $), hash it
    const password = this.get('password');
    if (typeof password === 'string' && !password.startsWith('$2')) {
      try {
        // Store the plaintext in oldPassword before hashing
        this.set('oldPassword', password);
        
        // Hash the password
        this.set('password', bcrypt.hashSync(password, 10));
        
        // Store previous password in history
        const passwordHistory = this.get('passwordHistory') || [];
        // Only store the password if it's not the default and not already in history
        if (password !== '012345' && !passwordHistory.includes(password)) {
          passwordHistory.push(password);
          if (passwordHistory.length > 5) {
            passwordHistory.shift(); // Keep only the 5 most recent passwords
          }
          this.set('passwordHistory', passwordHistory);
        }
      } catch (error) {
        console.error('Error hashing password:', error);
        // Create a new error object instead of passing the unknown error
        const err = new Error(error instanceof Error ? error.message : 'Password hashing failed');
        return next(err);
      }
    }
  }
  
  next();
});

// No custom methods - we'll handle validation in the route handlers

// Ensure the model hasn't been compiled before
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema); 