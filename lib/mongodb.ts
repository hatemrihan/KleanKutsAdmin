import { MongoClient } from 'mongodb';
import { MONGODB_URI, MONGODB_DB, validateMongoDBUri } from './env';

// Validate MongoDB URI
const uriValidation = validateMongoDBUri();
if (!uriValidation.valid) {
  console.error('MongoDB URI validation failed:', uriValidation.reason);
  throw new Error(`Invalid MongoDB URI: ${uriValidation.reason}`);
}

// Connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  try {
    console.log('MongoDB connection attempt - Current status:', cachedClient ? 'Cached client exists' : 'No cached client');
    
    // If we have a cached connection, use it
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    console.log('Creating new MongoDB connection');
    
    // Connection options for better reliability
    const options = {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };
    
    // Create a new connection
    const client = new MongoClient(MONGODB_URI, options);
    console.log('Connecting to MongoDB...');
    
    await client.connect();
    console.log('MongoDB connection successful!');
    
    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    // Set up connection event handlers
    client.on('close', () => {
      console.warn('MongoDB connection closed');
      cachedClient = null;
      cachedDb = null;
    });
    
    client.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cachedClient = null;
      cachedDb = null;
    });
    
    client.on('timeout', () => {
      console.warn('MongoDB connection timeout');
      cachedClient = null;
      cachedDb = null;
    });

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    
    // Reset cache if connection fails
    cachedClient = null;
    cachedDb = null;
    
    // Provide more detailed error information
    if (error instanceof Error) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//USER:PASSWORD@')
      };
      console.error('Connection error details:', errorDetails);
    }
    
    throw error;
  }
}
