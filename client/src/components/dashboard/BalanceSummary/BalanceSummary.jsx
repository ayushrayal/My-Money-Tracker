import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './BalanceSummary.module.scss';

// Explicitly documented as placeholder preview data
const MOCK_BALANCE_DATA = [
  {
    id: 'total-balance',
    label: 'Total Balance',
    amount: '$18,450.00',
    type: 'balance',
    icon: Wallet,
    change: '+12.4%',
    changeVariant: 'income',
    footnote: 'Across all accounts',
    isPrimary: true,
  },
  {
    id: 'monthly-income',
    label: 'Monthly Income',
    amount: '$5,200.00',
    type: 'income',
    icon: TrendingUp,
    change: 'Salary + Side',
    changeVariant: 'income',
    footnote: 'Expected: $5,200',
    isPrimary: false,
  },
  {
    id: 'monthly-expense',
    label: 'Monthly Expenses',
    amount: '$2,480.00',
    type: 'expense',
    icon: TrendingDown,
    change: '47.6% of income',
    changeVariant: 'expense',
    footnote: 'Limit: $3,200',
    isPrimary: false,
  },
  {
    id: 'net-savings',
    label: 'Net Savings',
    amount: '$2,720.00',
    type: 'savings',
    icon: PiggyBank,
    change: '52.4% rate',
    changeVariant: 'info',
    footnote: 'Target: $2,000/mo',
    isPrimary: false,
  },
];

export function BalanceSummary() {
  return (
    <section aria-label="Financial Balances Summary">
      <div className={styles.grid}>
        {MOCK_BALANCE_DATA.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`${styles.metricCard} ${item.isPrimary ? styles.primaryHighlight : ''}`.trim()}
            >
              <div className={styles.topRow}>
                <span className={styles.label}>{item.label}</span>
                <div
                  className={`${styles.iconBadge} ${styles[item.type]}`}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </div>
              </div>

              <div className={styles.amount}>{item.amount}</div>

              <div className={styles.bottomRow}>
                <Badge variant={item.changeVariant}>{item.change}</Badge>
                <span className={styles.footnote}>{item.footnote}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

