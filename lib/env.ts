// Utility for managing environment variables

// Function to clean environment variables
function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  // Remove quotes that might be accidentally included in .env files
  return value.replace(/["']/g, '');
}

// MongoDB connection string
export const MONGODB_URI = cleanEnv(process.env.MONGODB_URI);

// MongoDB database name
export const MONGODB_DB = cleanEnv(process.env.MONGODB_DB) || 'elevee';

// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
export const CLOUDINARY_API_KEY = cleanEnv(process.env.CLOUDINARY_API_KEY);
export const CLOUDINARY_API_SECRET = cleanEnv(process.env.CLOUDINARY_API_SECRET);
export const CLOUDINARY_UPLOAD_PRESET = cleanEnv(process.env.CLOUDINARY_UPLOAD_PRESET || 'kleankuts_upload');

// Next Auth
export const NEXTAUTH_URL = cleanEnv(process.env.NEXTAUTH_URL);
export const NEXTAUTH_SECRET = cleanEnv(process.env.NEXTAUTH_SECRET);

// Application environment
export const NODE_ENV = cleanEnv(process.env.NODE_ENV) || 'development';

// Validate required environment variables
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    { key: 'MONGODB_URI', value: MONGODB_URI },
    { key: 'CLOUDINARY_CLOUD_NAME', value: CLOUDINARY_CLOUD_NAME },
    { key: 'CLOUDINARY_API_KEY', value: CLOUDINARY_API_KEY },
    { key: 'CLOUDINARY_API_SECRET', value: CLOUDINARY_API_SECRET },
    { key: 'CLOUDINARY_UPLOAD_PRESET', value: CLOUDINARY_UPLOAD_PRESET },
  ];
  
  const missing = required.filter(item => !item.value).map(item => item.key);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Check MongoDB URI format
export function validateMongoDBUri(): { valid: boolean; reason?: string } {
  if (!MONGODB_URI) {
    return { valid: false, reason: 'MONGODB_URI is not defined' };
  }
  
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    return { 
      valid: false, 
      reason: 'Invalid format - must start with mongodb:// or mongodb+srv://' 
    };
  }
  
  return { valid: true };
}

// Export all environment variables for easy access
export default {
  MONGODB_URI,
  MONGODB_DB,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET,
  NEXTAUTH_URL,
  NEXTAUTH_SECRET,
  NODE_ENV,
  validateEnv,
  validateMongoDBUri
}; 