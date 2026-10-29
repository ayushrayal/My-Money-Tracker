import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  HandCoins,
  Zap,
} from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './CategoryBudgets.module.scss';

const MOCK_CATEGORIES = [
  {
    id: 'housing',
    name: 'Rent & Housing',
    icon: Home,
    spent: 1200,
    limit: 1200,
    status: 'warning',
  },
  {
    id: 'groceries',
    name: 'Groceries',
    icon: ShoppingCart,
    spent: 420,
    limit: 550,
    status: 'safe',
  },
  {
    id: 'dining',
    name: 'Dining & Cafes',
    icon: Utensils,
    spent: 280,
    limit: 300,
    status: 'warning',
  },
  {
    id: 'loans',
    name: 'Informal Loans Repayment',
    icon: HandCoins,
    spent: 300,
    limit: 500,
    status: 'safe',
  },
  {
    id: 'transport',
    name: 'Transport & Fuel',
    icon: Car,
    spent: 160,
    limit: 250,
    status: 'safe',
  },
  {
    id: 'utilities',
    name: 'Utilities & Bills',
    icon: Zap,
    spent: 120,
    limit: 150,
    status: 'safe',
  },
];

export function CategoryBudgets() {
  return (
    <section className={styles.card} aria-label="Category Budget Progress">
      <div className={styles.header}>
        <h2 className={styles.title}>Category Budgets</h2>
        <Badge variant="neutral">Monthly</Badge>
      </div>

      <div className={styles.categoryList}>
        {MOCK_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const percentage = Math.min(Math.round((cat.spent / cat.limit) * 100), 100);
          const statusClass =
            percentage >= 100
              ? styles.danger
              : percentage >= 85
              ? styles.warning
              : styles.safe;

          return (
            <div key={cat.id} className={styles.categoryItem}>
              <div className={styles.itemHeader}>
                <div className={styles.itemLeft}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className={styles.name}>{cat.name}</span>
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.amounts}>
                    <span className={styles.spent}>${cat.spent}</span> / ${cat.limit}
                  </span>
                  <Badge
                    variant={
                      percentage >= 100 ? 'expense' : percentage >= 85 ? 'warning' : 'neutral'
                    }
                  >
                    {percentage}%
                  </Badge>
                </div>
              </div>

              <div
                className={styles.track}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${cat.name} budget progress`}
              >
                <div
                  className={`${styles.fill} ${statusClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

