import { api } from './api.js';

export async function fetchSalary(month) {
  const endpoint = month
    ? `/api/salary?month=${encodeURIComponent(month)}`
    : '/api/salary';
  const response = await api.get(endpoint);
  return response.data;
}

export async function configureSalary(data) {
  const response = await api.post('/api/salary', data);
  return response.data?.salary;
}

export async function receiveSalary(data) {
  const response = await api.post('/api/salary/receive', data);
  return response.data;
}

export async function addAdditionalIncome(data) {
  const response = await api.post('/api/salary/additional', data);
  return response.data;
}

export async function fetchSalaryHistory() {
  const response = await api.get('/api/salary/history');
  return response.data?.history || [];
}

