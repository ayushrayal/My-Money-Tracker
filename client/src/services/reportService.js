import { api } from './api.js';

export const reportService = {
  async getSummary({ year, month } = {}) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/api/reports/summary${qs}`);
    return res.data;
  },

  async exportTransactionsCsv({ month, startDate, endDate, type, category } = {}) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    if (category) params.append('category', category);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.download(`/api/reports/export/transactions${qs}`, `transactions_${month || 'export'}.csv`);
  },

  async exportMonthlySummaryCsv(year) {
    const qs = year ? `?year=${year}` : '';
    return api.download(`/api/reports/export/monthly-summary${qs}`, `monthly_summary_${year || 'report'}.csv`);
  },

  async exportLoansCsv() {
    return api.download('/api/reports/export/loans', 'loans_report.csv');
  },

  async exportSavingsCsv() {
    return api.download('/api/reports/export/savings', 'savings_report.csv');
  },
};

