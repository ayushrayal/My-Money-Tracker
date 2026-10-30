import { Badge } from '../../common/Badge/Badge';
import styles from './SpendingOverview.module.scss';

export function SpendingOverview({ totals, month }) {
  const expense = totals?.expense || 0;
  const income = totals?.income || 0;
  const transfer = totals?.transfer || 0;

  // Day of month for daily average burn rate
  const now = new Date();
  const currentDay = now.getDate();
  const avgDaily = currentDay > 0 ? (expense / currentDay).toFixed(2) : '0.00';

  const percentUsed = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const isOverspent = expense > income && income > 0;

  return (
    <div className={styles.overviewCard}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Monthly Cashflow Ratio</h2>
          <span className={styles.subtitle}>
            {month ? `Period: ${month}` : 'Current Month'} • Real ledger transactions
          </span>
        </div>
        <Badge variant={isOverspent ? 'expense' : 'income'}>
          {income > 0 ? `${percentUsed}% of Income Spent` : 'Active Month'}
        </Badge>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressStats}>
          <span>
            Total Spent: <strong className={styles.spentAmount}>₹{expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </span>
          <span className={styles.limitAmount}>
            Income: ₹{income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={percentUsed}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Monthly cashflow ratio"
        >
          <div
            className={`${styles.progressBar} ${isOverspent ? styles.danger : ''}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Net Monthly Savings</span>
          <span className={styles.statValue}>
            ₹{(income - expense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Daily Spend</span>
          <span className={styles.statValue}>₹{avgDaily} / day</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Transfers (Excluded)</span>
          <span className={styles.statValue}>₹{transfer.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
