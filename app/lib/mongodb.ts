// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from "mongodb"

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URL || process.env.MONGODB_URI

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URL" or "MONGODB_URI"')
}

// Ensure URI starts with mongodb:// or mongodb+srv://
const formattedUri = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://') 
  ? uri 
  : `mongodb+srv://${uri}`

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(formattedUri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(formattedUri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise
export default clientPromise