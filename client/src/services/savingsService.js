import { api } from './api.js';

export async function fetchSavingsGoals(includeArchived = false) {
  const endpoint = `/api/savings${includeArchived ? '?includeArchived=true' : ''}`;
  const response = await api.get(endpoint);
  return response.data;
}

export async function fetchSavingsGoal(id) {
  const response = await api.get(`/api/savings/${id}`);
  return response.data;
}

export async function createSavingsGoal(data) {
  const response = await api.post('/api/savings', data);
  return response.data?.goal;
}

export async function updateSavingsGoal(id, data) {
  const response = await api.patch(`/api/savings/${id}`, data);
  return response.data?.goal;
}

export async function recordSavingsContribution(goalId, data) {
  const response = await api.post(`/api/savings/${goalId}/contributions`, data);
  return response.data;
}

export async function deleteSavingsContribution(goalId, contributionId) {
  const response = await api.delete(`/api/savings/${goalId}/contributions/${contributionId}`);
  return response.data;
}

export async function applyOwnerSavingsPreset() {
  const response = await api.post('/api/savings/preset');
  return response.data?.goal;
}

