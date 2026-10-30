import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService';
import { fetchCategories } from '../services/categoryService';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { DeleteConfirmModal } from '../components/transactions/DeleteConfirmModal';
import { Button } from '../components/common/Button/Button';
import { Badge } from '../components/common/Badge/Badge';
import { Select } from '../components/common/Select/Select';
import { MonthPicker } from '../components/common/MonthPicker/MonthPicker';
import styles from './TransactionsPage.module.scss';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Failed to load categories:', err.message));
  }, []);

  // Fetch transactions
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchTransactions({
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        month: monthFilter || undefined,
        page,
        limit: 15,
      });

      setTransactions(data.transactions || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, categoryFilter, paymentMethodFilter, monthFilter, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleCreateOrUpdate = async (formData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id || editingTransaction._id, formData);
    } else {
      await createTransaction(formData);
    }
    await loadTransactions();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTransaction.id || deletingTransaction._id);
      setDeletingTransaction(null);
      await loadTransactions();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Count active filters
  const activeFiltersCount = [
    Boolean(search),
    Boolean(typeFilter),
    Boolean(categoryFilter),
    Boolean(paymentMethodFilter),
    Boolean(monthFilter),
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setPaymentMethodFilter('');
    setMonthFilter('');
    setPage(1);
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({
      value: cat.id || cat._id,
      label: cat.name,
      secondary: cat.type,
    })),
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Top action bar */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Transactions Ledger</h1>
          <span className={styles.pageSubtitle}>
            Live records of income, expenses, and account transfers
          </span>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search description or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
              aria-label="Search transactions"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={styles.clearSearchBtn}
                aria-label="Clear search text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Select
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            options={TYPE_OPTIONS}
            placeholder="All Types"
            aria-label="Filter by Type"
            className={styles.filterControlNarrow}
          />

          <Select
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            options={categoryOptions}
            placeholder="All Categories"
            aria-label="Filter by Category"
            className={styles.filterControlMedium}
          />

          <Select
            value={paymentMethodFilter}
            onChange={(val) => {
              setPaymentMethodFilter(val);
              setPage(1);
            }}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="All Methods"
            aria-label="Filter by Payment Method"
            className={styles.filterControlNarrow}
          />

          <MonthPicker
            value={monthFilter}
            onChange={(val) => {
              setMonthFilter(val);
              setPage(1);
            }}
            placeholder="All Months"
            allowClear
            aria-label="Filter by Month"
            className={styles.filterControlMonth}
          />

          {activeFiltersCount > 0 && (
            <Button
              variant="soft"
              size="sm"
              onClick={handleResetFilters}
            >
              <Filter size={13} />
              <span>Reset ({activeFiltersCount})</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className={styles.serverAlert} role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Transactions Table / List */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>
            Showing {transactions.length} of {pagination.total} transactions
          </span>
          {pagination.total > 0 && (
            <Badge variant="neutral">Page {pagination.page} of {pagination.totalPages}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loadingWrapper} role="status">
            <div className={styles.spinner} aria-hidden="true" />
            <span>Loading transactions ledger...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <Inbox size={28} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>No transactions found</h3>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              {activeFiltersCount > 0
                ? 'Try adjusting your filters or date range.'
                : 'Get started by recording your first transaction.'}
            </p>
            {activeFiltersCount > 0 ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Active Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={14} />
                <span>Record Transaction</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.desktopTableContainer}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Date</th>
                      <th>Description</th>
                      <th style={{ width: '160px' }}>Category</th>
                      <th style={{ width: '110px' }}>Method</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const isTransfer = tx.type === 'transfer';
                      const sign = isTransfer ? '⇄ ' : isIncome ? '+₹' : '-₹';

                      return (
                        <tr key={tx.id || tx._id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#6B7280' }}>
                            {formatDate(tx.date)}
                          </td>
                          <td>
                            <div className={styles.txDetails}>
                              <span className={styles.txDescription}>{tx.description}</span>
                              {tx.notes && <span className={styles.txNotes}>{tx.notes}</span>}
                            </div>
                          </td>
                          <td>
                            {tx.category ? (
                              <Badge variant="neutral">{tx.category.name}</Badge>
                            ) : isTransfer ? (
                              <Badge variant="info">Transfer</Badge>
                            ) : (
                              <Badge variant="neutral">Uncategorized</Badge>
                            )}
                          </td>
                          <td>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              className={`${styles.amount} ${
                                isTransfer
                                  ? styles.transfer
                                  : isIncome
                                  ? styles.income
                                  : styles.expense
                              }`}
                            >
                              {sign}
                              {Number(tx.amount).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className={styles.actionCell} style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => {
                                  setEditingTransaction(tx);
                                  setIsModalOpen(true);
                                }}
                                title="Edit transaction"
                                aria-label={`Edit ${tx.description}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.delete}`}
                                onClick={() => setDeletingTransaction(tx)}
                                title="Delete transaction"
                                aria-label={`Delete ${tx.description}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (320px to 768px) */}
            <div className={styles.mobileCardList}>
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const sign = isTransfer ? '⇄ ' : isIncome ? '+₹' : '-₹';

                return (
                  <div key={tx.id || tx._id} className={styles.mobileTxCard}>
                    <div className={styles.mobileCardHeader}>
                      <div>
                        <strong style={{ color: '#1F2937', fontSize: '0.875rem' }}>{tx.description}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {formatDate(tx.date)} • {tx.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                      <span
                        className={`${styles.amount} ${
                          isTransfer
                            ? styles.transfer
                            : isIncome
                            ? styles.income
                            : styles.expense
                        }`}
                      >
                        {sign}
                        {Number(tx.amount).toFixed(2)}
                      </span>
                    </div>

                    {tx.notes && (
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0' }}>{tx.notes}</p>
                    )}

                    <div className={styles.mobileCardFooter}>
                      {tx.category ? (
                        <Badge variant="neutral">{tx.category.name}</Badge>
                      ) : (
                        <Badge variant="info">Transfer</Badge>
                      )}

                      <div className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsModalOpen(true);
                          }}
                          aria-label={`Edit ${tx.description}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => setDeletingTransaction(tx)}
                          aria-label={`Delete ${tx.description}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        className={styles.mobileFab}
        onClick={() => {
          setEditingTransaction(null);
          setIsModalOpen(true);
        }}
        title="Add transaction"
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </button>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTransaction}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        transaction={deletingTransaction}
        isDeleting={isDeleting}
      />
    </div>
  );
}
