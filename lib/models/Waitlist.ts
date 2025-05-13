import mongoose from 'mongoose';

const WaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'subscribed'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'website'
  }
});

// Prevent duplicate model compilation error in development
export default mongoose.models.Waitlist || mongoose.model('Waitlist', WaitlistSchema); 