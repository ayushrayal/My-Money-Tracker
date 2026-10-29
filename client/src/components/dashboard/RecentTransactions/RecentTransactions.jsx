import {
  Briefcase,
  ShoppingCart,
  Utensils,
  HandCoins,
  Zap,
} from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './RecentTransactions.module.scss';

const MOCK_TRANSACTIONS = [
  {
    id: 'tx-1',
    title: 'Monthly Salary Deposit',
    category: 'salary',
    account: 'Bank Account',
    date: 'Today, 09:30 AM',
    amount: 4500.0,
    type: 'income',
    icon: Briefcase,
  },
  {
    id: 'tx-2',
    title: 'Organic Food Market',
    category: 'groceries',
    account: 'Debit Card',
    date: 'Yesterday, 05:45 PM',
    amount: -86.5,
    type: 'expense',
    icon: ShoppingCart,
  },
  {
    id: 'tx-3',
    title: 'Weekend Bistro Dinner',
    category: 'dining',
    account: 'UPI / Cash',
    date: 'Oct 26, 08:15 PM',
    amount: -45.0,
    type: 'expense',
    icon: Utensils,
  },
  {
    id: 'tx-4',
    title: 'Alex Friend Loan Repayment',
    category: 'loan',
    account: 'Direct Transfer',
    date: 'Oct 24, 02:00 PM',
    amount: 250.0,
    type: 'income',
    icon: HandCoins,
  },
  {
    id: 'tx-5',
    title: 'High-speed Fiber Internet',
    category: 'utilities',
    account: 'Auto-Debit',
    date: 'Oct 22, 11:10 AM',
    amount: -60.0,
    type: 'expense',
    icon: Zap,
  },
];

export function RecentTransactions() {
  return (
    <section className={styles.card} aria-label="Recent Transactions Preview">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Transactions</h2>
        <Badge variant="neutral">Demo Preview</Badge>
      </div>

      <div className={styles.transactionList}>
        {MOCK_TRANSACTIONS.map((tx) => {
          const Icon = tx.icon;
          const isIncome = tx.type === 'income';
          const formattedAmount = `${isIncome ? '+' : '-'}$${Math.abs(tx.amount).toFixed(2)}`;

          return (
            <div key={tx.id} className={styles.transactionItem}>
              <div className={styles.leftCol}>
                <div
                  className={`${styles.iconCircle} ${styles[tx.category] || ''}`}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </div>
                <div className={styles.details}>
                  <span className={styles.titleText}>{tx.title}</span>
                  <div className={styles.subMeta}>
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className={styles.accountBadge}>{tx.account}</span>
                  </div>
                </div>
              </div>

              <div className={styles.rightCol}>
                <span
                  className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}
                >
                  {formattedAmount}
                </span>
                <span className={styles.statusText}>{isIncome ? 'Received' : 'Paid'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

