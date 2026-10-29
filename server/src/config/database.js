import mongoose from 'mongoose';
import { env } from './env.js';

// Safe URI logger that masks username and password credentials
export function sanitizeMongoUri(uri) {
  if (!uri) return '[not configured]';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
}

let isConnected = false;

export async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!env.MONGODB_URI) {
    if (env.IS_PRODUCTION) {
      throw new Error('[Database] MONGODB_URI is not set. Terminating in production.');
    } else {
      console.warn('[Database] MONGODB_URI is not set. Database operations will fail until a connection string is provided.');
      return null;
    }
  }

  const sanitized = sanitizeMongoUri(env.MONGODB_URI);

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !env.IS_PRODUCTION, // Build indexes automatically in dev/test only
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected: ${sanitized}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[Database] Connection error to ${sanitized}:`, error.message);
    if (env.IS_PRODUCTION) {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      console.log('[Database] MongoDB disconnected cleanly.');
    } catch (err) {
      console.error('[Database] Error while disconnecting:', err.message);
    }
  }
}

// Global connection event hooks
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('[Database] MongoDB connection lost.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB runtime error:', err.message);
});

