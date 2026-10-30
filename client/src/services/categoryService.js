import { api } from './api.js';

export async function fetchCategories() {
  const response = await api.get('/api/categories');
  return response.data?.categories || [];
}

export async function createCategory(categoryData) {
  const response = await api.post('/api/categories', categoryData);
  return response.data?.category;
}

export async function updateCategory(id, categoryData) {
  const response = await api.patch(`/api/categories/${id}`, categoryData);
  return response.data?.category;
}

export async function deleteCategory(id) {
  const response = await api.delete(`/api/categories/${id}`);
  return response;
}

