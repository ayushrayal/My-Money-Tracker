import app from './app.js';
import { env } from './config/env.js';
import dns from 'dns';

if (process.env.USE_CUSTOM_DNS === 'true' || (process.env.NODE_ENV !== 'production' && process.env.USE_CUSTOM_DNS !== 'false')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    // Ignore DNS set errors if unsupported
  }
}

import { connectDB, disconnectDB, sanitizeMongoUri } from './config/database.js';
import { ensureDefaultCategories } from './services/category.service.js';

let server = null;

async function startServer() {
  try {
    // Attempt database connection
    if (env.MONGODB_URI) {
      await connectDB();
      await ensureDefaultCategories();
    } else {
      console.warn('[Server] Notice: MONGODB_URI is not set. Database operations will be unavailable until configured.');
    }

    server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`  My Money Tracker API Server`);
      console.log(`  Status: Running`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Port: ${env.PORT}`);
      console.log(`  MongoDB: ${sanitizeMongoUri(env.MONGODB_URI)}`);
      console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`  Allowed Origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n[Process] Received ${signal}. Closing HTTP server and database gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('[Process] HTTP server closed cleanly.');
      await disconnectDB();
      console.log('[Process] Clean shutdown complete. Exiting.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force shutdown if taking longer than 10 seconds
  setTimeout(() => {
    console.error('[Process] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception thrown:', err.message || err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer();
