import { Badge } from '../../common/Badge/Badge';
import styles from './SpendingOverview.module.scss';

export function SpendingOverview() {
  const totalBudget = 3200;
  const totalSpent = 2480;
  const percentUsed = Math.round((totalSpent / totalBudget) * 100);
  const remainingDays = 6;

  return (
    <div className={styles.overviewCard}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Monthly Spending Overview</h2>
          <span className={styles.subtitle}>Target cycle: 1st - 31st of month</span>
        </div>
        <Badge variant={percentUsed > 85 ? 'warning' : 'income'}>
          {percentUsed}% Used
        </Badge>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressStats}>
          <span>
            Spent: <strong className={styles.spentAmount}>${totalSpent.toLocaleString()}</strong>
          </span>
          <span className={styles.limitAmount}>
            Budget: ${totalBudget.toLocaleString()}
          </span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={percentUsed}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Monthly spending budget usage"
        >
          <div
            className={styles.progressBar}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Remaining Budget</span>
          <span className={styles.statValue}>${(totalBudget - totalSpent).toLocaleString()}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Daily Spend</span>
          <span className={styles.statValue}>$80.00 / day</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Days Remaining</span>
          <span className={styles.statValue}>{remainingDays} Days</span>
        </div>
      </div>
    </div>
  );
}

