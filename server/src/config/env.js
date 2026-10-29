import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowedEnvs = ['development', 'production', 'test'];
  if (!allowedEnvs.includes(nodeEnv)) {
    console.warn(`[Config] Warning: Unrecognized NODE_ENV="${nodeEnv}". Defaulting to "development".`);
  }

  const rawPort = process.env.PORT || '5001';
  const port = parseInt(rawPort, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`[Config] Invalid PORT value: "${rawPort}". PORT must be an integer between 1 and 65535.`);
  }

  // Parse CORS allowed origins - never allow '*' with credentials in production
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const rawOrigins = process.env.ALLOWED_ORIGINS || clientUrl;
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173');
  }

  // Rate Limiting
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
  const authRateLimitWindowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10);
  const authRateLimitMaxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10);

  // MongoDB URI
  const mongodbUri = process.env.MONGODB_URI || '';
  if (nodeEnv === 'production' && !mongodbUri) {
    throw new Error('[Config] MONGODB_URI is required in production environment.');
  }

  // JWT Secret
  const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'development' || nodeEnv === 'test'
    ? 'dev_insecure_jwt_secret_min_32_chars_long_123456789'
    : '');

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('[Config] JWT_SECRET must be at least 32 characters long.');
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // Cookie Settings
  const cookieSecure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : nodeEnv === 'production';

  const cookieSameSite = process.env.COOKIE_SAME_SITE || 'lax'; // 'lax' works with same-site / Vite proxy, 'none' for cross-domain

  return Object.freeze({
    NODE_ENV: nodeEnv,
    PORT: port,
    CLIENT_URL: clientUrl,
    ALLOWED_ORIGINS: allowedOrigins,
    RATE_LIMIT_WINDOW_MS: rateLimitWindowMs,
    RATE_LIMIT_MAX_REQUESTS: rateLimitMaxRequests,
    AUTH_RATE_LIMIT_WINDOW_MS: authRateLimitWindowMs,
    AUTH_RATE_LIMIT_MAX_REQUESTS: authRateLimitMaxRequests,
    MONGODB_URI: mongodbUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    COOKIE_SECURE: cookieSecure,
    COOKIE_SAME_SITE: cookieSameSite,
    IS_PRODUCTION: nodeEnv === 'production',
  });
}

export const env = validateEnv();
