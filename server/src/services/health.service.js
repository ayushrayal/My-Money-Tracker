import { env } from '../config/env.js';

export function getHealthStatus() {
  const uptimeSeconds = Math.floor(process.uptime());

  return {
    status: 'healthy',
    service: 'my-money-tracker-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptimeSeconds,
  };
}

