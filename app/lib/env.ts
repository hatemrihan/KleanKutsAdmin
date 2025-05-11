// Utility for managing environment variables

// MongoDB connection string
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://seif:seif123@seif.pulbpsi.mongodb.net/?retryWrites=true&w=majority';

// API URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Other environment variables
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate environment
export function validateEnv() {
  const missing: string[] = [];
  
  if (!MONGODB_URI) missing.push('MONGODB_URI');
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  // Validate MongoDB URI format
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB URI format. Should start with mongodb:// or mongodb+srv://');
    return false;
  }
  
  return true;
}

// Log environment status (for debugging)
export function logEnvStatus() {
  console.log('Environment Status:', {
    nodeEnv: NODE_ENV,
    mongodbUri: MONGODB_URI.substring(0, 15) + '...',
    apiUrl: API_URL,
    isValid: validateEnv()
  });
} 