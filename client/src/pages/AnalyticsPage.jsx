import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  HandCoins,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import styles from './AnalyticsPage.module.scss';

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

export function AnalyticsPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const currencySymbol = user?.preferences?.currency === 'USD' ? '$' : '₹';

  const fullMonthStr = `${selectedYear}-${selectedMonth}`;

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      setError('');
      try {
        const res = await analyticsService.getOverview({
          year: selectedYear,
          month: fullMonthStr,
        });
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedYear, fullMonthStr]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `${currencySymbol}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const currentMonthData = data?.incomeVsExpenses?.find(
    (m) => m.month === fullMonthStr
  ) || { income: 0, expense: 0, net: 0, savings: 0 };

  // Calculate bar heights for Income vs Expenses chart
  const maxBarValue = Math.max(
    ...(data?.incomeVsExpenses?.map((m) => Math.max(m.income, m.expense)) || [1000]),
    1000
  );

  return (
    <div className={styles.analyticsContainer}>
      {/* Top Bar with Filters */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h2>Financial Analytics</h2>
          <p>Cash flow trends, category breakdown, budget utilization & wealth metrics</p>
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

      {isLoading ? (
        <div className={styles.emptyBox}>Loading analytics overview...</div>
      ) : error ? (
        <div className={styles.emptyBox} style={{ color: '#E03131' }}>
          {error}
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Monthly Income</span>
              <span className={`${styles.kpiValue} ${styles.income}`}>
                {formatCurrency(currentMonthData.income)}
              </span>
              <span className={`${styles.kpiSub} ${data?.monthOverMonth?.changes?.incomeChangePct >= 0 ? styles.positive : styles.negative}`}>
                {data?.monthOverMonth?.changes?.incomeChangePct >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {Math.abs(data?.monthOverMonth?.changes?.incomeChangePct || 0)}% vs last month
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Monthly Expenses</span>
              <span className={`${styles.kpiValue} ${styles.expense}`}>
                {formatCurrency(currentMonthData.expense)}
              </span>
              <span className={`${styles.kpiSub} ${data?.monthOverMonth?.changes?.expenseChangePct <= 0 ? styles.positive : styles.negative}`}>
                {data?.monthOverMonth?.changes?.expenseChangePct <= 0 ? (
                  <ArrowDownRight size={12} />
                ) : (
                  <ArrowUpRight size={12} />
                )}
                {Math.abs(data?.monthOverMonth?.changes?.expenseChangePct || 0)}% vs last month
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Net Cash Flow</span>
              <span className={`${styles.kpiValue} ${styles.net}`}>
                {formatCurrency(currentMonthData.net)}
              </span>
              <span className={styles.kpiSub}>
                Savings Rate: {data?.yearlyOverview?.savingsRate || 0}%
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Yearly Net Saved</span>
              <span className={styles.kpiValue}>
                {formatCurrency(data?.yearlyOverview?.totalSaved || 0)}
              </span>
              <span className={styles.kpiSub}>
                Annual Net: {formatCurrency(data?.yearlyOverview?.netCashFlow || 0)}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsGrid}>
            {/* Income vs Expenses Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{selectedYear} Monthly Cash Flow</h3>
                <div className={styles.chartLegend}>
                  <span>
                    <span className={styles.legendDot} style={{ backgroundColor: '#087F5B' }} />
                    Income
                  </span>
                  <span>
                    <span className={styles.legendDot} style={{ backgroundColor: '#E03131' }} />
                    Expenses
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  className={styles.barChartSvg}
                  viewBox="0 0 600 220"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                  <line x1="40" y1="90" x2="580" y2="90" stroke="#E5E7EB" strokeDasharray="3 3" />
                  <line x1="40" y1="160" x2="580" y2="160" stroke="#E5E7EB" strokeDasharray="3 3" />
                  <line x1="40" y1="180" x2="580" y2="180" stroke="#D1D5DB" />

                  {/* 12 months bars */}
                  {data?.incomeVsExpenses?.map((item, idx) => {
                    const groupWidth = 40;
                    const groupX = 50 + idx * 44;
                    const chartHeight = 150;

                    const incHeight = maxBarValue > 0 ? (item.income / maxBarValue) * chartHeight : 0;
                    const expHeight = maxBarValue > 0 ? (item.expense / maxBarValue) * chartHeight : 0;

                    const isCurrent = item.month === fullMonthStr;

                    return (
                      <g key={item.month} className={styles.barGroup}>
                        {/* Income bar */}
                        <rect
                          x={groupX}
                          y={180 - incHeight}
                          width={14}
                          height={Math.max(incHeight, 2)}
                          fill={isCurrent ? '#087F5B' : '#68D391'}
                          rx={2}
                        >
                          <title>{`${item.monthLabel}: Income ${formatCurrency(item.income)}`}</title>
                        </rect>

                        {/* Expense bar */}
                        <rect
                          x={groupX + 16}
                          y={180 - expHeight}
                          width={14}
                          height={Math.max(expHeight, 2)}
                          fill={isCurrent ? '#E03131' : '#FEB2B2'}
                          rx={2}
                        >
                          <title>{`${item.monthLabel}: Expenses ${formatCurrency(item.expense)}`}</title>
                        </rect>

                        {/* Label */}
                        <text
                          x={groupX + 15}
                          y="200"
                          fontSize="10"
                          textAnchor="middle"
                          fill={isCurrent ? '#087F5B' : '#6B7280'}
                          fontWeight={isCurrent ? 'bold' : 'normal'}
                        >
                          {item.monthLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Spending Breakdown</h3>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  {data?.categoryBreakdown?.length || 0} Categories
                </span>
              </div>

              {data?.categoryBreakdown?.length === 0 ? (
                <div className={styles.emptyBox}>No expenses recorded for this month.</div>
              ) : (
                <div className={styles.categoryList}>
                  {data?.categoryBreakdown?.map((cat) => (
                    <div key={cat.categoryId} className={styles.categoryRow}>
                      <div className={styles.catInfo}>
                        <span className={styles.catName}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: cat.color || '#087F5B',
                              display: 'inline-block',
                            }}
                          />
                          {cat.categoryName}
                        </span>
                        <span className={styles.catAmount}>
                          {formatCurrency(cat.amount)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: cat.color || '#087F5B',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Budget, Loans & Savings Grid */}
          <div className={styles.chartsGrid}>
            {/* Budget Utilization */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Budget Utilization ({fullMonthStr})</h3>
                {data?.budgetUtilization ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color:
                        data.budgetUtilization.overallPercent > 100
                          ? '#E03131'
                          : data.budgetUtilization.overallPercent >= 80
                          ? '#D97706'
                          : '#087F5B',
                    }}
                  >
                    {data.budgetUtilization.overallPercent}% Used
                  </span>
                ) : null}
              </div>

              {!data?.budgetUtilization ? (
                <div className={styles.emptyBox}>No budget configured for {fullMonthStr}.</div>
              ) : (
                <div className={styles.categoryList}>
                  {data.budgetUtilization.categories.map((c) => (
                    <div key={c.categoryId} className={styles.categoryRow}>
                      <div className={styles.catInfo}>
                        <span className={styles.catName}>{c.categoryName}</span>
                        <span className={styles.catAmount}>
                          {formatCurrency(c.spent)} / {formatCurrency(c.limit)}
                        </span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${Math.min(c.percentUsed, 100)}%`,
                            backgroundColor:
                              c.thresholdStatus === 'exceeded'
                                ? '#E03131'
                                : c.thresholdStatus === 'warning'
                                ? '#F59E0B'
                                : '#087F5B',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Savings & Loan Repayments Progress */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Wealth & Debt Tracker</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Savings summary */}
                <div>
                  <div className={styles.catInfo} style={{ marginBottom: 6 }}>
                    <span className={styles.catName}>
                      <ShieldCheck size={16} color="#087F5B" /> Savings Goals Progress
                    </span>
                    <span className={styles.catAmount}>
                      {formatCurrency(data?.savingsGoals?.totalCurrent || 0)} /{' '}
                      {formatCurrency(data?.savingsGoals?.totalTarget || 0)}
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(data?.savingsGoals?.overallProgress || 0, 100)}%`,
                        backgroundColor: '#087F5B',
                      }}
                    />
                  </div>
                  <small style={{ color: '#6B7280', fontSize: '0.6875rem', marginTop: 4, display: 'block' }}>
                    {data?.savingsGoals?.goals?.filter((g) => g.isCompleted).length || 0} of{' '}
                    {data?.savingsGoals?.goals?.length || 0} goals achieved
                  </small>
                </div>

                {/* Loan summary */}
                <div>
                  <div className={styles.catInfo} style={{ marginBottom: 6 }}>
                    <span className={styles.catName}>
                      <HandCoins size={16} color="#4F46E5" /> Loan Repayments Progress
                    </span>
                    <span className={styles.catAmount}>
                      {formatCurrency(data?.loanProgress?.totalRepaid || 0)} /{' '}
                      {formatCurrency(data?.loanProgress?.totalPrincipal || 0)}
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(data?.loanProgress?.progressPercent || 0, 100)}%`,
                        backgroundColor: '#4F46E5',
                      }}
                    />
                  </div>
                  <small style={{ color: '#6B7280', fontSize: '0.6875rem', marginTop: 4, display: 'block' }}>
                    {data?.loanProgress?.activeLoansCount || 0} active loans (Remaining:{' '}
                    {formatCurrency(data?.loanProgress?.remainingBalance || 0)})
                  </small>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

