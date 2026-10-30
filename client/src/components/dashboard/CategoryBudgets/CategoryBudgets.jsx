import { Tag, PieChart } from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './CategoryBudgets.module.scss';

export function CategoryBudgets({ categoryBreakdown = [], totalExpense = 0 }) {
  const hasExpenses = categoryBreakdown.length > 0 && totalExpense > 0;

  return (
    <section className={styles.card} aria-label="Category Spending Breakdown">
      <div className={styles.header}>
        <h2 className={styles.title}>Spending by Category</h2>
        <Badge variant={hasExpenses ? 'neutral' : 'warning'}>
          {hasExpenses ? `${categoryBreakdown.length} Categories` : 'No Data'}
        </Badge>
      </div>

      {!hasExpenses ? (
        <div className={styles.emptyState}>
          <PieChart size={28} color="#9CA3AF" aria-hidden="true" />
          <p>No expense records found for this period.</p>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            Recorded expenses will appear here with proportional spending breakdown.
          </span>
        </div>
      ) : (
        <div className={styles.categoryList}>
          {categoryBreakdown.map((cat) => {
            const percentage = totalExpense > 0 ? Math.round((cat.spent / totalExpense) * 100) : 0;
            const categoryColor = cat.color || '#087F5B';

            return (
              <div key={cat.categoryId} className={styles.categoryItem}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemLeft}>
                    <div
                      className={styles.iconCircle}
                      style={{
                        backgroundColor: `${categoryColor}18`,
                        color: categoryColor,
                      }}
                      aria-hidden="true"
                    >
                      <Tag size={14} />
                    </div>
                    <span className={styles.name}>{cat.name}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.amounts}>
                      <span className={styles.spent}>₹{Number(cat.spent).toFixed(2)}</span> ({percentage}%)
                    </span>
                    <Badge variant="neutral">{cat.count} tx</Badge>
                  </div>
                </div>

                <div
                  className={styles.track}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${cat.name} share of monthly spending`}
                >
                  <div
                    className={styles.fill}
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: categoryColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
