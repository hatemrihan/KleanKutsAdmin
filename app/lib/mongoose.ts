import mongoose from "mongoose";
import { MONGODB_URI, logEnvStatus } from "./env";

// Log environment status
logEnvStatus();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a different approach to declare the global variable
const globalWithMongoose = global as unknown as { mongoose: MongooseCache };
const cached: MongooseCache = globalWithMongoose.mongoose || { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

export async function mongooseConnect() {
  try {
    console.log('mongooseConnect called, connection state:', mongoose.connection.readyState);
    
    if (cached.conn) {
      console.log('Returning cached connection');
      return cached.conn;
    }

    if (!cached.promise) {
      console.log('Creating new connection promise with URI:', MONGODB_URI.substring(0, 15) + '...');
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connection successful');
        return mongoose;
      });
    }

    try {
      console.log('Awaiting connection promise');
      cached.conn = await cached.promise;
      console.log('Connection established, readyState:', mongoose.connection.readyState);
    } catch (e) {
      console.error('Error in mongoose connection:', e);
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    console.error('mongooseConnect error:', error);
    throw error;
  }
}

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});