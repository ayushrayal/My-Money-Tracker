import { Wallet, TrendingUp, TrendingDown, PiggyBank, PlusCircle } from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import { Button } from '../../common/Button/Button';
import { MonthPicker } from '../../common/MonthPicker/MonthPicker';
import styles from './BalanceSummary.module.scss';

export function BalanceSummary({
  totals,
  isLoading,
  selectedMonth,
  onMonthChange,
  onAddExpense,
}) {
  const income = totals?.income || 0;
  const expense = totals?.expense || 0;
  const netSavings = totals?.netSavings ?? (income - expense);
  const savingsRate = totals?.savingsRate || 0;
  const transfers = totals?.transfer || 0;

  const cards = [
    {
      id: 'net-cashflow',
      label: 'Monthly Net Cashflow',
      amount: `₹${netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: 'balance',
      icon: Wallet,
      change: netSavings >= 0 ? 'Surplus' : 'Deficit',
      changeVariant: netSavings >= 0 ? 'income' : 'expense',
      footnote: 'Income minus expenses',
      isPrimary: true,
    },
    {
      id: 'monthly-income',
      label: 'Monthly Income',
      amount: `₹${income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: 'income',
      icon: TrendingUp,
      change: 'Real records',
      changeVariant: 'income',
      footnote: `${totals?.count || 0} total entries`,
      isPrimary: false,
    },
    {
      id: 'monthly-expense',
      label: 'Monthly Expenses',
      amount: `₹${expense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: 'expense',
      icon: TrendingDown,
      change: income > 0 ? `${Math.min(100, Math.round((expense / income) * 100))}% of income` : 'Recorded',
      changeVariant: 'expense',
      footnote: 'Excludes transfers',
      isPrimary: false,
    },
    {
      id: 'savings-rate',
      label: 'Savings Rate',
      amount: `${savingsRate}%`,
      type: 'savings',
      icon: PiggyBank,
      change: netSavings >= 0 ? 'Positive' : 'Deficit',
      changeVariant: netSavings >= 0 ? 'info' : 'warning',
      footnote: transfers > 0 ? `+ ₹${transfers.toFixed(0)} transfers` : 'Net saved / income',
      isPrimary: false,
    },
  ];

  return (
    <section className={styles.sectionWrapper} aria-label="Monthly Cashflow Summary">
      <div className={styles.topRowActionBar}>
        <div className={styles.headerLeft}>
          <h2 className={styles.sectionTitle}>Financial Snapshot</h2>
        </div>

        <div className={styles.headerActions}>
          {onMonthChange && (
            <MonthPicker
              value={selectedMonth || ''}
              onChange={(val) => onMonthChange(val)}
              placeholder="Current Month"
              allowClear={false}
              size="sm"
              aria-label="Select snapshot month"
              className={styles.monthPicker}
            />
          )}

          {onAddExpense && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddExpense}
            >
              <PlusCircle size={15} />
              <span>Add Expense</span>
            </Button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {cards.map((item) => {
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

              <div className={styles.amount}>
                {isLoading ? '...' : item.amount}
              </div>

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
