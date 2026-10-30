import { api } from './api.js';

export async function fetchTransactions(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/transactions${queryString ? `?${queryString}` : ''}`;
  const response = await api.get(endpoint);
  return response.data;
}

export async function fetchTransactionSummary(month) {
  const endpoint = month
    ? `/api/transactions/summary?month=${encodeURIComponent(month)}`
    : '/api/transactions/summary';
  const response = await api.get(endpoint);
  return response.data;
}

export async function fetchTransactionById(id) {
  const response = await api.get(`/api/transactions/${id}`);
  return response.data?.transaction;
}

export async function createTransaction(data) {
  const response = await api.post('/api/transactions', data);
  return response.data?.transaction;
}

export async function updateTransaction(id, data) {
  const response = await api.patch(`/api/transactions/${id}`, data);
  return response.data?.transaction;
}

export async function deleteTransaction(id) {
  const response = await api.delete(`/api/transactions/${id}`);
  return response;
}

