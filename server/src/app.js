import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration with explicit allowlist and credentials support
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests) with no origin header
    if (!origin) return callback(null, true);

    // Explicit origin check - disallow wildcard '*' when credentials: true
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(`CORS blocked request from unauthorized origin: ${origin}`);
    corsError.statusCode = 403;
    corsError.code = 'CORS_FORBIDDEN';
    return callback(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
};
app.use(cors(corsOptions));

// Cookie parser for reading HttpOnly JWT and CSRF cookies
app.use(cookieParser());

// JSON body parsing with reasonable size limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Apply rate limiter to all /api routes
app.use('/api', apiRateLimiter);

// Mount API routes
app.use('/api', apiRoutes);

// Centralized 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
