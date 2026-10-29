import { getHealthStatus } from '../services/health.service.js';

export function checkHealth(req, res) {
  const healthData = getHealthStatus();
  return res.status(200).json({
    success: true,
    data: healthData,
  });
}

