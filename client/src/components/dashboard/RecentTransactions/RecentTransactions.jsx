import { Link } from 'react-router-dom';
import {
  Briefcase,
  Tag,
  ArrowLeftRight,
  Plus,
  Receipt,
} from 'lucide-react';
import { Button } from '../../common/Button/Button';
import styles from './RecentTransactions.module.scss';

export function RecentTransactions({ transactions = [], isLoading, onAddExpense }) {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const match = typeof isoString === 'string' && isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const monthIndex = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, monthIndex, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className={styles.card} aria-label="Recent Transactions">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Transactions</h2>
        <Link to="/transactions" className={styles.viewAllLink}>
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
          Loading recent transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <Receipt size={32} color="#9CA3AF" aria-hidden="true" />
          <p style={{ fontWeight: 500, color: '#374151' }}>No transactions recorded yet.</p>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', maxWidth: '280px' }}>
            Your recent incomes, expenses, and transfers will appear here in chronological order.
          </span>
          <Button
            variant="soft"
            size="sm"
            onClick={onAddExpense}
          >
            <Plus size={14} />
            <span>Add First Expense</span>
          </Button>
        </div>
      ) : (
        <div className={styles.transactionList}>
          {transactions.slice(0, 5).map((tx) => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const sign = isTransfer ? '⇄ ₹' : isIncome ? '+₹' : '-₹';
            const formattedAmount = `${sign}${Number(tx.amount).toFixed(2)}`;

            return (
              <div key={tx.id || tx._id} className={styles.transactionItem}>
                <div className={styles.leftCol}>
                  <div
                    className={`${styles.iconCircle} ${
                      isIncome ? styles.income : isTransfer ? styles.transfer : styles.expense
                    }`}
                    aria-hidden="true"
                  >
                    {isTransfer ? (
                      <ArrowLeftRight size={18} />
                    ) : isIncome ? (
                      <Briefcase size={18} />
                    ) : (
                      <Tag size={18} />
                    )}
                  </div>
                  <div className={styles.details}>
                    <span className={styles.titleText}>{tx.description}</span>
                    <div className={styles.subMeta}>
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className={styles.accountBadge}>
                        {tx.paymentMethod ? tx.paymentMethod.toUpperCase() : 'UPI'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <span
                    className={`${styles.amount} ${
                      isIncome ? styles.income : isTransfer ? styles.transfer : styles.expense
                    }`}
                  >
                    {formattedAmount}
                  </span>
                  <span className={styles.statusText}>
                    {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
