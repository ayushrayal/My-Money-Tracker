import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Plus,
  AlertTriangle,
  X,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../components/common/Button/Button';
import { Badge } from '../components/common/Badge/Badge';
import { MonthPicker } from '../components/common/MonthPicker/MonthPicker';
import { DatePicker } from '../components/common/DatePicker/DatePicker';
import { Select } from '../components/common/Select/Select';
import {
  fetchBudget,
  applyOwnerBudgetPreset,
  copyBudget,
} from '../services/budgetService';
import {
  fetchSalary,
  receiveSalary,
  addAdditionalIncome,
} from '../services/salaryService';
import styles from './BudgetsPage.module.scss';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI / Google Pay' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Debit / Credit Card' },
  { value: 'other', label: 'Other' },
];

export function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [budgetData, setBudgetData] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isReceiveSalaryModalOpen, setIsReceiveSalaryModalOpen] = useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Form states
  const [receiveAmount, setReceiveAmount] = useState('25000');
  const [receiveDate, setReceiveDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [receiveMethod, setReceiveMethod] = useState('bank_transfer');
  const [receiveNotes, setReceiveNotes] = useState('');

  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [incomeMethod, setIncomeMethod] = useState('upi');
  const [incomeNotes, setIncomeNotes] = useState('');

  const [copySourceMonth, setCopySourceMonth] = useState('');

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [budgetRes, salaryRes] = await Promise.all([
        fetchBudget(selectedMonth),
        fetchSalary(selectedMonth),
      ]);

      setBudgetData(budgetRes);
      setSalaryData(salaryRes?.salary || null);

      if (salaryRes?.salary?.plannedAmount) {
        setReceiveAmount(String(salaryRes.salary.plannedAmount));
      } else {
        setReceiveAmount('25000');
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
      setErrorMsg(err.message || 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Handle Preset Setup
  const handleApplyPreset = async () => {
    try {
      setIsLoading(true);
      await applyOwnerBudgetPreset(selectedMonth);
      setSuccessMsg('Owner standard ₹25,000 monthly budget applied successfully!');
      await loadPageData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply preset');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Receive Salary
  const handleReceiveSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      await receiveSalary({
        month: selectedMonth,
        actualAmount: Number(receiveAmount),
        receivedDate: receiveDate,
        paymentMethod: receiveMethod,
        notes: receiveNotes,
      });

      setIsReceiveSalaryModalOpen(false);
      setSuccessMsg('Salary recorded as received and linked to transaction ledger!');
      await loadPageData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record salary receipt');
    }
  };

  // Handle Additional Income
  const handleAddIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      await addAdditionalIncome({
        month: selectedMonth,
        source: incomeSource,
        amount: Number(incomeAmount),
        date: incomeDate,
        paymentMethod: incomeMethod,
        notes: incomeNotes,
      });

      setIsAddIncomeModalOpen(false);
      setIncomeSource('');
      setIncomeAmount('');
      setSuccessMsg(`Additional income of ₹${Number(incomeAmount).toLocaleString('en-IN')} added!`);
      await loadPageData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add additional income');
    }
  };

  // Handle Copy Budget
  const handleCopyBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!copySourceMonth) return;
    try {
      await copyBudget(copySourceMonth, selectedMonth);
      setIsCopyModalOpen(false);
      setSuccessMsg(`Budget successfully copied from ${copySourceMonth} to ${selectedMonth}!`);
      await loadPageData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to copy budget');
    }
  };

  const budget = budgetData?.budget;
  const categoryAllocations = budget?.categoryAllocations || budgetData?.categorySpending || [];
  const summary = budgetData?.summary;

  const isSalaryReceived = salaryData?.status === 'received';

  return (
    <div className={styles.budgetsContainer}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Monthly Budget Planning</h2>
          <p className={styles.subtitle}>
            Plan your allocations, monitor 80% &amp; 100% spending limits, and track salary inflow.
          </p>
        </div>

        <div className={styles.topActions}>
          <MonthPicker
            value={selectedMonth}
            onChange={(m) => m && setSelectedMonth(m)}
            allowClear={false}
            aria-label="Select budget planning month"
          />

          <Button
            variant="outline"
            onClick={() => setIsCopyModalOpen(true)}
            title="Copy previous month budget configuration"
          >
            <Copy size={16} />
            <span>Copy Month</span>
          </Button>

          <Button
            variant="primary"
            onClick={handleApplyPreset}
            title="Apply owner ₹25,000 monthly financial profile"
          >
            <Sparkles size={16} />
            <span>Apply ₹25k Preset</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div role="status" className={styles.salaryBanner} style={{ backgroundColor: '#E5F3EA', borderColor: '#087F5B' }}>
          <div className={styles.salaryLeft}>
            <CheckCircle2 size={24} color="#087F5B" />
            <span style={{ color: '#124E3B', fontWeight: 600 }}>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className={styles.salaryBanner} style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626' }}>
          <div className={styles.salaryLeft}>
            <AlertTriangle size={24} color="#DC2626" />
            <span style={{ color: '#991B1B', fontWeight: 600 }}>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Salary & Income Status Banner */}
      <section className={styles.salaryBanner} aria-label="Salary Inflow Status">
        <div className={styles.salaryLeft}>
          <div className={styles.salaryIcon} aria-hidden="true">
            <Wallet size={24} />
          </div>

          <div className={styles.salaryInfo}>
            <div className={styles.salaryHeading}>
              <span className={styles.salaryTitle}>
                {isSalaryReceived ? 'Salary Received & Verified' : 'Monthly Planned Salary'}
              </span>
              <Badge variant={isSalaryReceived ? 'income' : 'warning'}>
                {isSalaryReceived ? (
                  <>
                    <CheckCircle2 size={12} /> Received
                  </>
                ) : (
                  <>
                    <Clock size={12} /> Planned
                  </>
                )}
              </Badge>
            </div>

            <p className={styles.salaryDetail}>
              {isSalaryReceived ? (
                <>
                  ₹{Number(salaryData?.receivedAmount || salaryData?.actualAmount || 25000).toLocaleString('en-IN')} received on{' '}
                  {new Date(salaryData?.receivedDate || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  via {salaryData?.paymentMethod?.replace('_', ' ') || 'bank transfer'} (Linked to Ledger).
                </>
              ) : (
                <>
                  Planned monthly salary of ₹{Number(salaryData?.plannedAmount || 25000).toLocaleString('en-IN')} expected ~1st of the month.
                  Will not count as ledger income until confirmed.
                </>
              )}
            </p>
          </div>
        </div>

        <div className={styles.salaryActions}>
          <Button
            variant={isSalaryReceived ? 'outline' : 'primary'}
            onClick={() => setIsReceiveSalaryModalOpen(true)}
          >
            {isSalaryReceived ? 'Update Receipt' : 'Mark Salary Received'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAddIncomeModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add Extra Income</span>
          </Button>
        </div>
      </section>

      {/* Summary KPI Cards */}
      {budget && (
        <section className={styles.summaryGrid} aria-label="Monthly Budget Summary KPIs">
          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Expected Income</span>
            <span className={styles.cardValue}>
              ₹{Number(budget.expectedIncome || 25000).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>
              {isSalaryReceived ? 'Salary confirmed' : 'Awaiting deposit'}
            </span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Category Limits Total</span>
            <span className={styles.cardValue}>
              ₹{Number(summary?.totalCategoryLimits || 19000).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>Across {categoryAllocations.length} categories</span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Actual Expenses Spent</span>
            <span className={styles.cardValue} style={{ color: (summary?.totalSpent || 0) > (summary?.totalCategoryLimits || 19000) ? '#DC2626' : '#1F2937' }}>
              ₹{Number(summary?.totalSpent || 0).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>
              {summary?.overallPercentUsed || 0}% of budget spent
            </span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Remaining Budget</span>
            <span
              className={styles.cardValue}
              style={{ color: (summary?.totalRemaining || 0) < 0 ? '#DC2626' : '#087F5B' }}
            >
              ₹{Number(summary?.totalRemaining || 0).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>Available to spend</span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Planned Savings</span>
            <span className={styles.cardValue} style={{ color: '#087F5B' }}>
              ₹{Number(budget.savingsTarget || 4000).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>Target reserve</span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.cardLabel}>Emergency Buffer</span>
            <span className={styles.cardValue} style={{ color: '#4F46E5' }}>
              ₹{Number(budget.bufferAllocation || 2000).toLocaleString('en-IN')}
            </span>
            <span className={styles.cardSubtext}>Unallocated safety pool</span>
          </div>
        </section>
      )}

      {/* Category Allocations Section */}
      <section className={styles.categoriesSection} aria-label="Category Budget Limits">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Category Limits &amp; Pacing</h3>
          <Badge variant="neutral">
            Threshold warnings at 80% &amp; 100%
          </Badge>
        </div>

        {categoryAllocations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <PieChart size={32} />
            </div>
            <h4 className={styles.emptyTitle}>No Budget Configured for this Month</h4>
            <p className={styles.emptyText}>
              Set up your budget allocations to track spending limits and receive alerts when categories approach 80% and 100% thresholds.
            </p>
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={handleApplyPreset}>
                <Sparkles size={16} />
                <span>Apply Owner's ₹25,000 Setup</span>
              </Button>
              <Button variant="outline" onClick={() => setIsCopyModalOpen(true)}>
                <Copy size={16} />
                <span>Copy from Previous Month</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {categoryAllocations.map((item) => {
              const catName = item.categoryName || item.category?.name || 'Category';
              const limit = item.allocatedAmount ?? item.limit ?? 0;
              const spent = item.actualSpent ?? item.spent ?? 0;
              const remaining = item.remainingAmount ?? item.remaining ?? (limit - spent);
              const percent = item.percentUsed ?? (limit > 0 ? Math.round((spent / limit) * 100) : 0);
              const status = item.thresholdStatus || (percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'normal');

              const isExceeded = status === 'exceeded';
              const isWarning = status === 'warning';

              return (
                <div
                  key={item.allocationId || item._id || catName}
                  className={`${styles.categoryCard} ${
                    isExceeded ? styles.exceededBorder : isWarning ? styles.warningBorder : ''
                  }`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.catNameWrapper}>
                      <span
                        className={styles.catDot}
                        style={{ backgroundColor: item.category?.color || '#087F5B' }}
                      />
                      <span className={styles.catName}>{catName}</span>
                    </div>

                    {isExceeded ? (
                      <Badge variant="expense">
                        <AlertTriangle size={12} /> {percent}% Exceeded
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="warning">
                        <Clock size={12} /> {percent}% Warning
                      </Badge>
                    ) : (
                      <Badge variant="income">
                        <CheckCircle2 size={12} /> {percent}% On Track
                      </Badge>
                    )}
                  </div>

                  <div className={styles.amountsRow}>
                    <span className={styles.spentAmount}>
                      ₹{Number(spent).toLocaleString('en-IN')}
                    </span>
                    <span className={styles.limitAmount}>
                      of ₹{Number(limit).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className={`${styles.progressBarFill} ${
                        isExceeded
                          ? styles.exceededFill
                          : isWarning
                          ? styles.warningFill
                          : styles.normalFill
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>

                  <div className={styles.cardBottom}>
                    <span>
                      {remaining >= 0 ? 'Remaining:' : 'Over budget by:'}
                    </span>
                    <span
                      className={`${styles.remainingTag} ${
                        remaining >= 0 ? styles.positive : styles.negative
                      }`}
                    >
                      ₹{Math.abs(remaining).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Mark Salary Received */}
      {isReceiveSalaryModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsReceiveSalaryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="salary-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="salary-modal-title" className={styles.modalTitle}>
                {isSalaryReceived ? 'Update Salary Receipt' : 'Record Salary Receipt'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsReceiveSalaryModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReceiveSalarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="receive-amount">Actual Salary Amount (₹)</label>
                <input
                  id="receive-amount"
                  type="number"
                  min="1"
                  required
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Deposit Date</label>
                <DatePicker
                  value={receiveDate}
                  onChange={setReceiveDate}
                  aria-label="Salary received date"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment / Credit Method</label>
                <Select
                  value={receiveMethod}
                  onChange={setReceiveMethod}
                  options={PAYMENT_METHODS}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="receive-notes">Notes (Optional)</label>
                <input
                  id="receive-notes"
                  type="text"
                  placeholder="e.g. Credited to Salary Account"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsReceiveSalaryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Confirm Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Extra Income */}
      {isAddIncomeModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsAddIncomeModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="income-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="income-modal-title" className={styles.modalTitle}>Record Additional Income</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsAddIncomeModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddIncomeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="income-source">Income Source</label>
                <input
                  id="income-source"
                  type="text"
                  placeholder="e.g. Freelance Design, Bonus, Gift"
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="income-amount">Amount (₹)</label>
                <input
                  id="income-amount"
                  type="number"
                  min="1"
                  required
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date Received</label>
                <DatePicker
                  value={incomeDate}
                  onChange={setIncomeDate}
                  aria-label="Income received date"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <Select
                  value={incomeMethod}
                  onChange={setIncomeMethod}
                  options={PAYMENT_METHODS}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="income-notes">Notes (Optional)</label>
                <input
                  id="income-notes"
                  type="text"
                  placeholder="Additional context"
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsAddIncomeModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Record Income
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Copy Budget */}
      {isCopyModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCopyModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="copy-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="copy-modal-title" className={styles.modalTitle}>Copy Previous Month Budget</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCopyModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCopyBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                Copy all category spending limits, expected salary, and savings targets from a previous month into{' '}
                <strong>{selectedMonth}</strong>.
              </p>

              <div className={styles.formGroup}>
                <label>Select Source Month</label>
                <MonthPicker
                  value={copySourceMonth}
                  onChange={setCopySourceMonth}
                  aria-label="Source month to copy from"
                  placeholder="Pick source month..."
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsCopyModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={!copySourceMonth}>
                  Copy into {selectedMonth}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
