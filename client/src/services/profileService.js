import { api } from './api.js';

export const profileService = {
  async getProfile() {
    const res = await api.get('/api/profile');
    return res.data;
  },

  async updateProfile({ name, email, avatar }) {
    const res = await api.patch('/api/profile', { name, email, avatar });
    return res.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await api.post('/api/profile/change-password', {
      currentPassword,
      newPassword,
    });
    return res;
  },

  async updatePreferences(preferences) {
    const res = await api.patch('/api/profile/preferences', preferences);
    return res.data;
  },
};

