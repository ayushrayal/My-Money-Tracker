import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { DemoBanner } from '../components/common/DemoBanner/DemoBanner';
import { BalanceSummary } from '../components/dashboard/BalanceSummary/BalanceSummary';
import { Phase4Summary } from '../components/dashboard/Phase4Summary/Phase4Summary';
import { SpendingOverview } from '../components/dashboard/SpendingOverview/SpendingOverview';
import { CategoryBudgets } from '../components/dashboard/CategoryBudgets/CategoryBudgets';
import { RecentTransactions } from '../components/dashboard/RecentTransactions/RecentTransactions';
import { ServerStatusCard } from '../components/dashboard/ServerStatusCard/ServerStatusCard';
import { TransactionModal } from '../components/transactions/TransactionModal';
import {
  fetchTransactionSummary,
  fetchTransactions,
  createTransaction,
} from '../services/transactionService';
import { fetchCategories } from '../services/categoryService';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month selection state (defaults to current calendar month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summary, txList, cats] = await Promise.all([
        fetchTransactionSummary(selectedMonth),
        fetchTransactions({ limit: 5 }),
        fetchCategories(),
      ]);

      setSummaryData(summary);
      setRecentTransactions(txList?.transactions || []);
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleAddExpenseSubmit = async (formData) => {
    await createTransaction(formData);
    await loadDashboardData();
  };

  const totals = summaryData?.totals || {
    income: 0,
    expense: 0,
    netSavings: 0,
    savingsRate: 0,
    transfer: 0,
    count: 0,
  };

  const categoryBreakdown = summaryData?.categoryBreakdown || [];

  return (
    <div className={styles.dashboardContainer}>
      {/* Live ledger notice */}
      <DemoBanner />

      {/* Financial Snapshot with month selector and prominent Add Expense trigger */}
      <BalanceSummary
        totals={totals}
        isLoading={isLoading}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onAddExpense={() => setIsAddModalOpen(true)}
      />

      {/* Phase 4 Integrated Suite Snapshot: Salary, Budgets, Loans, Savings */}
      <Phase4Summary summaryData={summaryData} />

      {/* Main Responsive Dashboard Grid */}
      <div className={styles.dashboardGrid}>
        <div className={styles.primaryColumn}>
          <SpendingOverview totals={totals} month={summaryData?.month} />
          <CategoryBudgets
            categoryBreakdown={categoryBreakdown}
            totalExpense={totals.expense}
          />
        </div>

        <div className={styles.secondaryColumn}>
          <RecentTransactions
            transactions={recentTransactions}
            isLoading={isLoading}
            onAddExpense={() => setIsAddModalOpen(true)}
          />
          <ServerStatusCard />
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) for fast expense entry */}
      <button
        type="button"
        className={styles.mobileFab}
        onClick={() => setIsAddModalOpen(true)}
        title="Quick add expense"
        aria-label="Add Expense"
      >
        <Plus size={24} />
      </button>

      {/* Quick Add Expense Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddExpenseSubmit}
        categories={categories}
        defaultType="expense"
      />
    </div>
  );
}
