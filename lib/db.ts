import mongoose from "mongoose";

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Throw error if MONGODB_URI is not defined
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Use a global cache to avoid creating multiple connections in dev/hot-reload
let cached = global.mongoose;

// If this is the first time, initialize the cache object
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB and reuse the connection across function calls
 * Useful in development to prevent hot-reload from opening too many connections
 */
export async function connectToDatabase() {
    // If already connected, return cached connection
    if (cached.conn) {
        return cached.conn;
    }

    // If a connection promise doesn’t exist, create one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable command buffering (optional optimization)
            maxPoolSize: 10,       // Limit the number of concurrent DB connections
        };

        // Start the connection and store the promise in cache
        cached.promise = mongoose.connect(MONGODB_URI as string, opts)
            .then(() => mongoose.connection);
    }

    try {
        // Wait for the connection to resolve and store it in the cache
        cached.conn = await cached.promise;
    } catch (error) {
        // Reset the promise on failure and throw a custom error
        cached.promise = null;
        throw new Error(`Failed to connect to the database: ${error}`);
    }

    // Return the connected mongoose instance
    return cached.conn;
}
