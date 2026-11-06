import { api } from './api.js';

export const analyticsService = {
  async getOverview({ year, month } = {}) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/api/analytics/overview${qs}`);
    return res.data;
  },
};

