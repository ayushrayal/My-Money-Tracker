import { api } from './api.js';

export async function fetchBudget(month) {
  const endpoint = month
    ? `/api/budgets?month=${encodeURIComponent(month)}`
    : '/api/budgets';
  const response = await api.get(endpoint);
  return response.data;
}

export async function createBudget(data) {
  const response = await api.post('/api/budgets', data);
  return response.data?.budget;
}

export async function updateBudget(id, data) {
  const response = await api.patch(`/api/budgets/${id}`, data);
  return response.data?.budget;
}

export async function copyBudget(sourceMonth, targetMonth) {
  const response = await api.post('/api/budgets/copy', { sourceMonth, targetMonth });
  return response.data?.budget;
}

export async function applyOwnerBudgetPreset(month) {
  const response = await api.post('/api/budgets/preset', { month });
  return response.data?.budget;
}

export async function fetchBudgetHistory() {
  const response = await api.get('/api/budgets/history');
  return response.data?.history || [];
}

