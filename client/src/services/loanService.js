import { api } from './api.js';

export async function fetchLoans() {
  const response = await api.get('/api/loans');
  return response.data;
}

export async function fetchLoan(id) {
  const response = await api.get(`/api/loans/${id}`);
  return response.data;
}

export async function createLoan(data) {
  const response = await api.post('/api/loans', data);
  return response.data?.loan;
}

export async function updateLoan(id, data) {
  const response = await api.patch(`/api/loans/${id}`, data);
  return response.data?.loan;
}

export async function recordLoanPayment(loanId, data) {
  const response = await api.post(`/api/loans/${loanId}/payments`, data);
  return response.data;
}

export async function deleteLoanPayment(loanId, paymentId) {
  const response = await api.delete(`/api/loans/${loanId}/payments/${paymentId}`);
  return response.data;
}

export async function applyOwnerLoansPreset() {
  const response = await api.post('/api/loans/preset');
  return response.data?.loans || [];
}

