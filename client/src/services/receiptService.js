import { api } from './api.js';

export const receiptService = {
  async uploadReceipt(transactionId, file) {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.upload(`/api/transactions/${transactionId}/receipt`, formData);
    return res.data;
  },

  async downloadReceipt(transactionId, filename = 'receipt') {
    return api.download(`/api/transactions/${transactionId}/receipt`, filename);
  },

  async deleteReceipt(transactionId) {
    const res = await api.delete(`/api/transactions/${transactionId}/receipt`);
    return res.data;
  },
};

