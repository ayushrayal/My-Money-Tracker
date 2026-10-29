import { api } from './api.js';

export async function signupUser(userData) {
  const response = await api.post('/api/auth/signup', userData);
  return response.data?.user;
}

export async function loginUser(credentials) {
  const response = await api.post('/api/auth/login', credentials);
  return response.data?.user;
}

export async function logoutUser() {
  const response = await api.post('/api/auth/logout', {});
  return response;
}

export async function fetchCurrentUser() {
  const response = await api.get('/api/auth/me');
  return response.data?.user;
}

