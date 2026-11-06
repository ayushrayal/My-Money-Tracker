import { api } from './api.js';

export const notificationService = {
  async getNotifications(limit = 30) {
    const res = await api.get(`/api/notifications?limit=${limit}`);
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await api.post('/api/notifications/read-all');
    return res;
  },

  async deleteNotification(id) {
    const res = await api.delete(`/api/notifications/${id}`);
    return res;
  },
};

