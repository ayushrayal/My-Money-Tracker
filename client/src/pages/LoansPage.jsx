import { useState, useEffect, useCallback } from 'react';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  AlertTriangle,
  X,
  History,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Button } from '../components/common/Button/Button';
import { Badge } from '../components/common/Badge/Badge';
import { DatePicker } from '../components/common/DatePicker/DatePicker';
import { Select } from '../components/common/Select/Select';
import {
  fetchLoans,
  fetchLoan,
  createLoan,
  recordLoanPayment,
  deleteLoanPayment,
  applyOwnerLoansPreset,
} from '../services/loanService';
import styles from './LoansPage.module.scss';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI / Google Pay' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Debit Card' },
  { value: 'other', label: 'Other' },
];

export function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLoanHistory, setSelectedLoanHistory] = useState(null);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);

  // Record payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [payMethod, setPayMethod] = useState('upi');
  const [payRecordAsExpense, setPayRecordAsExpense] = useState(true);
  const [payNotes, setPayNotes] = useState('');

  // New loan form
  const [newLender, setNewLender] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newStartDate, setNewStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newPlannedMonthly, setNewPlannedMonthly] = useState('');
  const [newFirstMonth, setNewFirstMonth] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadLoansData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchLoans();
      setLoans(data?.loans || []);
      setSummary(data?.summary || null);
    } catch (err) {
      console.error('Failed to load loans:', err);
      setErrorMsg(err.message || 'Failed to load informal loans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoansData();
  }, [loadLoansData]);

  // Handle Preset
  const handleApplyPreset = async () => {
    try {
      setIsLoading(true);
      await applyOwnerLoansPreset();
      setSuccessMsg('Owner 5-loan schedule (Loan A, B, C & Small Loans 1 & 2) loaded successfully!');
      await loadLoansData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply loans preset');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (loan) => {
    setSelectedLoanForPayment(loan);
    setPayAmount(String(loan.plannedMonthlyPayment || Math.min(1000, loan.outstandingBalance)));
    setIsRecordModalOpen(true);
  };

  // Submit Payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanForPayment) return;

    const amountNum = Number(payAmount);
    if (amountNum > selectedLoanForPayment.outstandingBalance) {
      setErrorMsg(`Payment amount (₹${amountNum}) exceeds outstanding balance (₹${selectedLoanForPayment.outstandingBalance})`);
      return;
    }

    try {
      const loanId = selectedLoanForPayment.id || selectedLoanForPayment._id;
      await recordLoanPayment(loanId, {
        amount: amountNum,
        paymentDate: payDate,
        paymentMethod: payMethod,
        recordAsExpense: payRecordAsExpense,
        notes: payNotes,
      });

      setIsRecordModalOpen(false);
      setSuccessMsg(`Payment of ₹${amountNum.toLocaleString('en-IN')} recorded for ${selectedLoanForPayment.lenderName}!`);
      await loadLoansData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record loan payment');
    }
  };

  // Open History
  const openHistoryModal = async (loan) => {
    try {
      const loanId = loan.id || loan._id;
      const data = await fetchLoan(loanId);
      setSelectedLoanHistory(data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load loan payment history');
    }
  };

  // Delete / Reverse Payment
  const handleReversePayment = async (loanId, paymentId) => {
    if (!window.confirm('Are you sure you want to reverse this loan payment? It will restore the loan balance and remove any linked expense transaction.')) {
      return;
    }

    try {
      await deleteLoanPayment(loanId, paymentId);
      setSuccessMsg('Loan payment reversed successfully.');
      const data = await fetchLoan(loanId);
      setSelectedLoanHistory(data);
      await loadLoansData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reverse payment');
    }
  };

  // Create New Loan
  const handleCreateLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLoan({
        lenderName: newLender,
        originalPrincipal: Number(newPrincipal),
        startDate: newStartDate,
        plannedMonthlyPayment: Number(newPlannedMonthly || 0),
        firstScheduledPaymentMonth: newFirstMonth || null,
        notes: newNotes,
      });

      setIsNewLoanModalOpen(false);
      setNewLender('');
      setNewPrincipal('');
      setNewPlannedMonthly('');
      setNewFirstMonth('');
      setNewNotes('');
      setSuccessMsg(`Loan with ${newLender} created successfully!`);
      await loadLoansData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create loan');
    }
  };

  return (
    <div className={styles.loansContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Informal Loans Tracker</h2>
          <p className={styles.subtitle}>
            Manage informal debts, planned repayment schedules, and atomic balance reconciliation.
          </p>
        </div>

        <div className={styles.topActions}>
          <Button variant="outline" onClick={() => setIsNewLoanModalOpen(true)}>
            <Plus size={16} />
            <span>Add Informal Loan</span>
          </Button>

          <Button variant="primary" onClick={handleApplyPreset}>
            <Sparkles size={16} />
            <span>Apply Owner Setup (5 Loans)</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div role="status" className={styles.strategyBanner} style={{ backgroundColor: '#E5F3EA', borderColor: '#087F5B' }}>
          <CheckCircle2 size={24} color="#087F5B" />
          <span style={{ color: '#124E3B', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className={styles.strategyBanner} style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626' }}>
          <AlertTriangle size={24} color="#DC2626" />
          <span style={{ color: '#991B1B', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {/* Strategy Banner */}
      <section className={styles.strategyBanner} aria-label="Owner Repayment Strategy">
        <div className={styles.bannerIcon} aria-hidden="true">
          <Info size={20} />
        </div>
        <div className={styles.bannerContent}>
          <span className={styles.bannerTitle}>Owner Strategic Payoff Plan</span>
          <p className={styles.bannerText}>
            <strong>November 2026 Focus:</strong> Close <em>Small Loan 1 (₹2,000)</em> and <em>Small Loan 2 (₹2,000)</em> completely + pay <em>Loan A (₹1,000)</em> = ₹5,000 total.
            <br />
            <strong>December 2026 Onward:</strong> Pay <em>Loan A (₹1,000)</em> + <em>Loan B (₹2,000)</em> + <em>Loan C (₹2,000)</em> = ₹5,000 monthly until all loans are eliminated.
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className={styles.kpiGrid} aria-label="Loans Summary Metrics">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Outstanding Debt</span>
          <span className={styles.kpiValue} style={{ color: (summary?.totalOutstandingBalance || 0) > 0 ? '#DC2626' : '#087F5B' }}>
            ₹{Number(summary?.totalOutstandingBalance || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.kpiSub}>Remaining balance to clear</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Original Principal</span>
          <span className={styles.kpiValue}>
            ₹{Number(summary?.totalOriginalPrincipal || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.kpiSub}>Initial borrowed sum</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Repaid So Far</span>
          <span className={styles.kpiValue} style={{ color: '#087F5B' }}>
            ₹{Number(summary?.totalPaidSoFar || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.kpiSub}>Verified payment records</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Loans</span>
          <span className={styles.kpiValue}>
            {summary?.activeLoansCount || 0}
          </span>
          <span className={styles.kpiSub}>{summary?.paidLoansCount || 0} loans fully cleared</span>
        </div>
      </section>

      {/* Loans Grid */}
      <section aria-label="Informal Loans List">
        {loans.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <HandCoins size={32} />
            </div>
            <h4 className={styles.emptyTitle}>No Informal Loans Tracked Yet</h4>
            <p className={styles.emptyText}>
              Keep an accurate ledger of all informal borrowings from friends, relatives, or lenders. Never lose track of repayment dates and outstanding balances.
            </p>
            <Button variant="primary" onClick={handleApplyPreset}>
              <Sparkles size={16} />
              <span>Load Owner's 5 Initial Loans</span>
            </Button>
          </div>
        ) : (
          <div className={styles.loansGrid}>
            {loans.map((loan) => {
              const isPaid = loan.status === 'paid' || loan.outstandingBalance === 0;
              const progress = loan.progressPercent || 0;

              return (
                <div
                  key={loan.id || loan._id}
                  className={`${styles.loanCard} ${isPaid ? styles.paidLoan : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.lenderName}>{loan.lenderName}</span>
                    <Badge variant={isPaid ? 'income' : 'warning'}>
                      {isPaid ? (
                        <>
                          <CheckCircle2 size={12} /> Cleared
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Active
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className={styles.balanceBox}>
                    <span className={styles.balanceLabel}>Outstanding Balance</span>
                    <div className={styles.balanceRow}>
                      <span className={`${styles.currentBalance} ${isPaid ? styles.zeroBalance : ''}`}>
                        ₹{Number(loan.outstandingBalance).toLocaleString('en-IN')}
                      </span>
                      <span className={styles.principal}>
                        of ₹{Number(loan.originalPrincipal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>

                  <div className={styles.loanDetails}>
                    <div className={styles.detailRow}>
                      <span>Planned Monthly:</span>
                      <span className={styles.detailVal}>
                        ₹{Number(loan.plannedMonthlyPayment || 0).toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    {loan.firstScheduledPaymentMonth && (
                      <div className={styles.detailRow}>
                        <span>First Scheduled:</span>
                        <span className={styles.detailVal}>{loan.firstScheduledPaymentMonth}</span>
                      </div>
                    )}

                    {loan.notes && (
                      <span className={styles.notesText}>{loan.notes}</span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHistoryModal(loan)}
                    >
                      <History size={14} />
                      <span>History</span>
                    </Button>

                    {!isPaid && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPaymentModal(loan)}
                      >
                        <TrendingDown size={14} />
                        <span>Pay</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Record Payment */}
      {isRecordModalOpen && selectedLoanForPayment && (
        <div className={styles.modalBackdrop} onClick={() => setIsRecordModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="pay-modal-title" className={styles.modalTitle}>
                Pay {selectedLoanForPayment.lenderName}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsRecordModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="pay-amt">Payment Amount (₹)</label>
                <input
                  id="pay-amt"
                  type="number"
                  min="1"
                  max={selectedLoanForPayment.outstandingBalance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Max allowed: ₹{Number(selectedLoanForPayment.outstandingBalance).toLocaleString('en-IN')}
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Payment Date</label>
                <DatePicker
                  value={payDate}
                  onChange={setPayDate}
                  aria-label="Payment date"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <Select
                  value={payMethod}
                  onChange={setPayMethod}
                  options={PAYMENT_METHODS}
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={payRecordAsExpense}
                  onChange={(e) => setPayRecordAsExpense(e.target.checked)}
                />
                <span>Create ledger expense entry in "Loans" category</span>
              </label>

              <div className={styles.formGroup}>
                <label htmlFor="pay-notes">Notes (Optional)</label>
                <input
                  id="pay-notes"
                  type="text"
                  placeholder="e.g. November EMI"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsRecordModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Record Repayment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Loan History */}
      {isHistoryModalOpen && selectedLoanHistory && (
        <div className={styles.modalBackdrop} onClick={() => setIsHistoryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="hist-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="hist-modal-title" className={styles.modalTitle}>
                {selectedLoanHistory.loan?.lenderName} Repayments
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsHistoryModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Total Paid:</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  ₹{Number(selectedLoanHistory.loan?.totalPaid || 0).toLocaleString('en-IN')}
                </strong>
              </div>

              {selectedLoanHistory.payments?.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center', padding: '1rem 0' }}>
                  No payments recorded yet for this loan.
                </p>
              ) : (
                <div className={styles.historyList}>
                  {selectedLoanHistory.payments?.map((p) => {
                    const paymentId = p.id || p._id;
                    const loanId = selectedLoanHistory.loan?.id || selectedLoanHistory.loan?._id;

                    return (
                      <div key={paymentId} className={styles.historyItem}>
                        <div className={styles.historyLeft}>
                          <span className={styles.historyAmount}>
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </span>
                          <span className={styles.historyDate}>
                            {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            {p.notes ? `• ${p.notes}` : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.reverseBtn}
                          onClick={() => handleReversePayment(loanId, paymentId)}
                          title="Reverse this payment and restore loan balance"
                        >
                          Reverse
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: New Loan */}
      {isNewLoanModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsNewLoanModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="newloan-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="newloan-modal-title" className={styles.modalTitle}>Add Informal Loan</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsNewLoanModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="new-lender">Lender / Creditor Name</label>
                <input
                  id="new-lender"
                  type="text"
                  placeholder="e.g. Uncle John, Friend Rahul"
                  required
                  value={newLender}
                  onChange={(e) => setNewLender(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-principal">Principal Amount (₹)</label>
                <input
                  id="new-principal"
                  type="number"
                  min="1"
                  required
                  value={newPrincipal}
                  onChange={(e) => setNewPrincipal(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Borrowing / Start Date</label>
                <DatePicker
                  value={newStartDate}
                  onChange={setNewStartDate}
                  aria-label="Loan start date"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-monthly">Planned Monthly Payment (₹)</label>
                <input
                  id="new-monthly"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  value={newPlannedMonthly}
                  onChange={(e) => setNewPlannedMonthly(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-firstmonth">First Scheduled Month (YYYY-MM)</label>
                <input
                  id="new-firstmonth"
                  type="text"
                  placeholder="2026-11"
                  value={newFirstMonth}
                  onChange={(e) => setNewFirstMonth(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-notes">Terms / Notes (Optional)</label>
                <input
                  id="new-notes"
                  type="text"
                  placeholder="Informal agreement terms"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsNewLoanModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Loan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
