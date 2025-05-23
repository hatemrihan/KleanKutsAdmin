// Utility for managing environment variables

// MongoDB connection string - IMPORTANT: Must be set in .env file
const mongodb_uri = process.env.MONGODB_URI || 
                   process.env.NEXT_PUBLIC_MONGODB_URI || 
                   process.env.DATABASE_URL;

if (!mongodb_uri) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

export const MONGODB_URI: string = mongodb_uri;

// API URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Other environment variables
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Validate environment
export function validateEnv() {
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
    isProduction: IS_PRODUCTION,
    mongodbUri: '[REDACTED]', // Never log sensitive credentials
    apiUrl: API_URL,
    isValid: validateEnv(),
    envVars: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      NEXT_PUBLIC_MONGODB_URI: !!process.env.NEXT_PUBLIC_MONGODB_URI,
      DATABASE_URL: !!process.env.DATABASE_URL
    }
  });
} 