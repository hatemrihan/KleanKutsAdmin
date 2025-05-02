import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Validate MongoDB URI format
if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
  throw new Error('Invalid MongoDB URI format. URI must start with mongodb:// or mongodb+srv://');
}

// Store the validated URI
const validatedUri = MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  try {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // Increased timeout for deployment
      socketTimeoutMS: 60000,
      family: 4,
      maxPoolSize: 10,
    };

    console.log(`Attempting to connect to MongoDB... (Environment: ${NODE_ENV})`, {
      uri: validatedUri.split('@')[1], // Log URI without credentials
      readyState: mongoose.connection.readyState,
      environment: NODE_ENV
    });

    if (!cached.promise) {
      cached.promise = mongoose.connect(validatedUri, opts).then((mongoose) => {
        const dbName = mongoose.connection.db?.databaseName || 'unknown';
        console.log('New MongoDB connection established', {
          readyState: mongoose.connection.readyState,
          dbName,
          environment: NODE_ENV
        });
        return mongoose;
      });
    }
    cached.conn = await cached.promise;

    // Add connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection event: connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection event: error', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection event: disconnected');
      cached.conn = null;
      cached.promise = null;
    });

    return cached.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      readyState: mongoose.connection.readyState,
      environment: NODE_ENV
    });
    
    // Reset cache on error
    cached.conn = null;
    cached.promise = null;
    
    throw new Error(`Failed to connect to MongoDB (${NODE_ENV}): ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 