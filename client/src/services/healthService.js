import { api } from './api.js';

export async function fetchHealthStatus() {
  const response = await api.get('/api/health');
  return response.data;
}

