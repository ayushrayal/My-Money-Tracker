import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  HandCoins,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import styles from './ReportsPage.module.scss';

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function ReportsPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  const fullMonthStr = `${selectedYear}-${selectedMonth}`;
  const currencySymbol = user?.preferences?.currency === 'USD' ? '$' : '₹';

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError('');
      try {
        const res = await reportService.getSummary({
          year: selectedYear,
          month: fullMonthStr,
        });
        setReport(res);
      } catch (err) {
        setError(err.message || 'Failed to load report summary.');
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [selectedYear, fullMonthStr]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `${currencySymbol}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const handleExport = async (type) => {
    setDownloading(type);
    try {
      if (type === 'transactions') {
        await reportService.exportTransactionsCsv({ month: fullMonthStr });
      } else if (type === 'monthly') {
        await reportService.exportMonthlySummaryCsv(selectedYear);
      } else if (type === 'loans') {
        await reportService.exportLoansCsv();
      } else if (type === 'savings') {
        await reportService.exportSavingsCsv();
      }
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className={styles.reportsContainer}>
      {/* Top Bar with Filters */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h2>Financial Reports & Exports</h2>
          <p>Download structured CSV statements and audit reconciliations</p>
        </div>

        <div className={styles.filterControls}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Filter Month"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Filter Year"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>
        </div>
      </div>

      {/* CSV Export Action Cards */}
      <div className={styles.exportsGrid}>
        <div className={styles.exportCard}>
          <div className={styles.cardHead}>
            <div className={styles.iconCircle}>
              <FileSpreadsheet size={18} />
            </div>
            <h4>Transactions CSV</h4>
          </div>
          <p>Detailed ledger with dates, categories, payment methods, receipts flag.</p>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={() => handleExport('transactions')}
            disabled={downloading === 'transactions'}
          >
            <Download size={14} />
            {downloading === 'transactions' ? 'Exporting...' : `Export (${fullMonthStr})`}
          </button>
        </div>

        <div className={styles.exportCard}>
          <div className={styles.cardHead}>
            <div className={styles.iconCircle}>
              <Calendar size={18} />
            </div>
            <h4>Annual Summary CSV</h4>
          </div>
          <p>12-month aggregated breakdown of income, expenses, cash flow & savings rates.</p>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={() => handleExport('monthly')}
            disabled={downloading === 'monthly'}
          >
            <Download size={14} />
            {downloading === 'monthly' ? 'Exporting...' : `Export (${selectedYear})`}
          </button>
        </div>

        <div className={styles.exportCard}>
          <div className={styles.cardHead}>
            <div className={styles.iconCircle}>
              <HandCoins size={18} />
            </div>
            <h4>Loans Ledger CSV</h4>
          </div>
          <p>All active & closed loans, original principal, repayments, and outstanding balances.</p>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={() => handleExport('loans')}
            disabled={downloading === 'loans'}
          >
            <Download size={14} />
            {downloading === 'loans' ? 'Exporting...' : 'Export Loans'}
          </button>
        </div>

        <div className={styles.exportCard}>
          <div className={styles.cardHead}>
            <div className={styles.iconCircle}>
              <ShieldCheck size={18} />
            </div>
            <h4>Savings Goals CSV</h4>
          </div>
          <p>Target goals, current savings balances, target dates, and achievement status.</p>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={() => handleExport('savings')}
            disabled={downloading === 'savings'}
          >
            <Download size={14} />
            {downloading === 'savings' ? 'Exporting...' : 'Export Savings'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
          Loading financial statement...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#E03131' }}>{error}</div>
      ) : (
        <>
          {/* Monthly Financial Breakdown */}
          <div className={styles.reportTableCard}>
            <h3 className={styles.cardTitle}>
              Monthly Statement Summary — {fullMonthStr}
            </h3>

            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className={styles.numeric}>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Income</td>
                    <td className={styles.numeric} style={{ color: '#087F5B', fontWeight: 600 }}>
                      {formatCurrency(report?.monthly?.income || 0)}
                    </td>
                    <td>Actual income transactions (salary & side gigs)</td>
                  </tr>
                  <tr>
                    <td>Total Expenses</td>
                    <td className={styles.numeric} style={{ color: '#E03131', fontWeight: 600 }}>
                      {formatCurrency(report?.monthly?.expenses || 0)}
                    </td>
                    <td>Outflow from categories</td>
                  </tr>
                  <tr>
                    <td>Net Operating Cash Flow</td>
                    <td
                      className={styles.numeric}
                      style={{
                        color: (report?.monthly?.netCashFlow || 0) >= 0 ? '#087F5B' : '#E03131',
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(report?.monthly?.netCashFlow || 0)}
                    </td>
                    <td>Income minus Expenses</td>
                  </tr>
                  <tr>
                    <td>Savings Contributions</td>
                    <td className={styles.numeric} style={{ fontWeight: 600 }}>
                      {formatCurrency(report?.monthly?.savingsContributions || 0)}
                    </td>
                    <td>Added into active savings reserves</td>
                  </tr>
                  <tr>
                    <td>Transfers Recorded</td>
                    <td className={styles.numeric}>
                      {formatCurrency(report?.monthly?.transfers || 0)}
                    </td>
                    <td>Neutral inter-account movements (excluded from cash flow)</td>
                  </tr>
                  <tr>
                    <td>Transactions Count</td>
                    <td className={styles.numeric}>{report?.monthly?.transactionCount || 0}</td>
                    <td>Ledger items recorded this month</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Distribution Statement */}
          <div className={styles.reportTableCard}>
            <h3 className={styles.cardTitle}>Category Expense Breakdown</h3>

            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className={styles.numeric}>Total Spent</th>
                    <th className={styles.numeric}>Share of Outflow</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.monthly?.categoryBreakdown?.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#6B7280' }}>
                        No categorized expense records for this month.
                      </td>
                    </tr>
                  ) : (
                    report?.monthly?.categoryBreakdown?.map((cat) => (
                      <tr key={cat.name}>
                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                        <td className={styles.numeric}>{formatCurrency(cat.amount)}</td>
                        <td className={styles.numeric}>{cat.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

