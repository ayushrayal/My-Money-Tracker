import { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  AlertTriangle,
  X,
  History,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/common/Button/Button';
import { Badge } from '../components/common/Badge/Badge';
import { DatePicker } from '../components/common/DatePicker/DatePicker';
import { Select } from '../components/common/Select/Select';
import {
  fetchSavingsGoals,
  fetchSavingsGoal,
  createSavingsGoal,
  recordSavingsContribution,
  deleteSavingsContribution,
  applyOwnerSavingsPreset,
} from '../services/savingsService';
import styles from './SavingsPage.module.scss';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI / Google Pay' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Debit Card' },
  { value: 'other', label: 'Other' },
];

const CATEGORIES = [
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'general', label: 'General Savings' },
  { value: 'vacation', label: 'Vacation & Travel' },
  { value: 'gadget', label: 'Tech & Gadgets' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export function SavingsPage() {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [selectedGoalForContrib, setSelectedGoalForContrib] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedGoalHistory, setSelectedGoalHistory] = useState(null);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);

  // Contribution Form
  const [contribAmount, setContribAmount] = useState('4000');
  const [contribDate, setContribDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [contribMethod, setContribMethod] = useState('bank_transfer');
  const [contribRecordTransfer, setContribRecordTransfer] = useState(true);
  const [contribNotes, setContribNotes] = useState('');

  // New Goal Form
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newMonthly, setNewMonthly] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadSavingsData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchSavingsGoals();
      setGoals(data?.goals || []);
      setSummary(data?.summary || null);
    } catch (err) {
      console.error('Failed to load savings goals:', err);
      setErrorMsg(err.message || 'Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavingsData();
  }, [loadSavingsData]);

  // Handle Preset
  const handleApplyPreset = async () => {
    try {
      setIsLoading(true);
      await applyOwnerSavingsPreset();
      setSuccessMsg('Owner Emergency Fund (₹30,000 target with ₹10,000 initial safety net) configured successfully!');
      await loadSavingsData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply savings preset');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Contribution Modal
  const openContributionModal = (goal) => {
    setSelectedGoalForContrib(goal);
    setContribAmount(String(goal.monthlyTarget || 4000));
    setIsContribModalOpen(true);
  };

  // Submit Contribution
  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoalForContrib) return;

    const amountNum = Number(contribAmount);
    try {
      const goalId = selectedGoalForContrib.id || selectedGoalForContrib._id;
      await recordSavingsContribution(goalId, {
        amount: amountNum,
        date: contribDate,
        paymentMethod: contribMethod,
        recordAsTransfer: contribRecordTransfer,
        notes: contribNotes,
      });

      setIsContribModalOpen(false);
      setSuccessMsg(`Deposit of ₹${amountNum.toLocaleString('en-IN')} added to ${selectedGoalForContrib.title}!`);
      await loadSavingsData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record contribution');
    }
  };

  // Open History
  const openHistoryModal = async (goal) => {
    try {
      const goalId = goal.id || goal._id;
      const data = await fetchSavingsGoal(goalId);
      setSelectedGoalHistory(data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load contribution history');
    }
  };

  // Reverse Contribution
  const handleReverseContribution = async (goalId, contribId) => {
    if (!window.confirm('Are you sure you want to reverse this savings deposit?')) {
      return;
    }

    try {
      await deleteSavingsContribution(goalId, contribId);
      setSuccessMsg('Contribution reversed successfully.');
      const data = await fetchSavingsGoal(goalId);
      setSelectedGoalHistory(data);
      await loadSavingsData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reverse contribution');
    }
  };

  // Create New Goal
  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSavingsGoal({
        title: newTitle,
        targetAmount: Number(newTarget),
        category: newCategory,
        monthlyTarget: Number(newMonthly || 0),
        notes: newNotes,
      });

      setIsNewGoalModalOpen(false);
      setNewTitle('');
      setNewTarget('');
      setNewCategory('general');
      setNewMonthly('');
      setNewNotes('');
      setSuccessMsg(`Savings goal "${newTitle}" created successfully!`);
      await loadSavingsData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create goal');
    }
  };

  const emergencyGoal = goals.find((g) => g.category === 'emergency_fund');

  return (
    <div className={styles.savingsContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Savings Goals &amp; Emergency Fund</h2>
          <p className={styles.subtitle}>
            Build your financial safety net with milestone targets and internal ledger allocations.
          </p>
        </div>

        <div className={styles.topActions}>
          <Button variant="outline" onClick={() => setIsNewGoalModalOpen(true)}>
            <Plus size={16} />
            <span>New Savings Goal</span>
          </Button>

          <Button variant="primary" onClick={handleApplyPreset}>
            <Sparkles size={16} />
            <span>Setup Emergency Fund</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div role="status" className={styles.emergencyBanner} style={{ backgroundColor: '#E5F3EA', borderColor: '#087F5B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="#087F5B" />
            <span style={{ color: '#124E3B', fontWeight: 600 }}>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className={styles.emergencyBanner} style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#DC2626" />
            <span style={{ color: '#991B1B', fontWeight: 600 }}>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Emergency Fund Highlight Banner */}
      {emergencyGoal && (
        <section className={styles.emergencyBanner} aria-label="Emergency Fund Milestone Ladder">
          <div className={styles.bannerTop}>
            <div className={styles.bannerTitleGroup}>
              <div className={styles.bannerIcon} aria-hidden="true">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className={styles.bannerTitle}>Emergency Fund Safety Net</span>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Target: ₹{Number(emergencyGoal.targetAmount).toLocaleString('en-IN')} • Current: ₹{Number(emergencyGoal.currentAmount).toLocaleString('en-IN')} ({emergencyGoal.progressPercent || 0}%)
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => openContributionModal(emergencyGoal)}
            >
              <TrendingUp size={14} />
              <span>Add ₹{emergencyGoal.monthlyTarget || 4000} Deposit</span>
            </Button>
          </div>

          <div className={styles.milestoneTrack}>
            {emergencyGoal.milestones?.map((m, idx) => {
              const isAchieved = m.achieved;
              return (
                <div
                  key={m._id || m.name || idx}
                  className={`${styles.milestoneItem} ${isAchieved ? styles.achieved : ''}`}
                >
                  <div className={styles.checkIcon}>
                    {isAchieved ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div className={styles.mContent}>
                    <span className={styles.mTitle}>{m.name}</span>
                    <span className={styles.mTarget}>
                      ₹{Number(m.targetAmount).toLocaleString('en-IN')} {isAchieved ? '• Achieved' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* KPI Cards */}
      <section className={styles.kpiGrid} aria-label="Savings Summary Metrics">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Accumulated Savings</span>
          <span className={styles.kpiValue} style={{ color: '#087F5B' }}>
            ₹{Number(summary?.totalCurrentSaved || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.kpiSub}>Across all active goals</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Target Sum</span>
          <span className={styles.kpiValue}>
            ₹{Number(summary?.totalTarget || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.kpiSub}>Long-term financial objective</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Planned Monthly Target</span>
          <span className={styles.kpiValue}>
            ₹{Number(summary?.monthlySavingsTarget || 4000).toLocaleString('en-IN')}/mo
          </span>
          <span className={styles.kpiSub}>Allocated from monthly salary</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Goals</span>
          <span className={styles.kpiValue}>
            {summary?.activeGoalsCount || goals.length}
          </span>
          <span className={styles.kpiSub}>Tracked with milestones</span>
        </div>
      </section>

      {/* Goals Grid */}
      <section aria-label="Savings Goals List">
        {goals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <PiggyBank size={32} />
            </div>
            <h4 className={styles.emptyTitle}>No Savings Goals Created Yet</h4>
            <p className={styles.emptyText}>
              Set up your ₹30,000 Emergency Fund with an initial ₹10,000 safety milestone or create custom goals for vacation, gadgets, or family buffers.
            </p>
            <Button variant="primary" onClick={handleApplyPreset}>
              <Sparkles size={16} />
              <span>Setup Owner Emergency Fund</span>
            </Button>
          </div>
        ) : (
          <div className={styles.goalsGrid}>
            {goals.map((goal) => {
              const progress = goal.progressPercent || 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;

              return (
                <div key={goal.id || goal._id} className={styles.goalCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.goalTitle}>{goal.title}</span>
                    <Badge variant={isComplete ? 'income' : 'info'}>
                      {goal.category?.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className={styles.savingsRow}>
                    <span className={styles.currentSaved}>
                      ₹{Number(goal.currentAmount).toLocaleString('en-IN')}
                    </span>
                    <span className={styles.targetTotal}>
                      of ₹{Number(goal.targetAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>

                  <div className={styles.goalDetails}>
                    <div className={styles.detailRow}>
                      <span>Monthly Plan:</span>
                      <span className={styles.detailVal}>
                        ₹{Number(goal.monthlyTarget || 0).toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span>Progress:</span>
                      <span className={styles.detailVal}>{progress}% saved</span>
                    </div>

                    {goal.notes && (
                      <span style={{ fontStyle: 'italic', marginTop: '0.25rem', color: '#6B7280' }}>
                        {goal.notes}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHistoryModal(goal)}
                    >
                      <History size={14} />
                      <span>History</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openContributionModal(goal)}
                    >
                      <Plus size={14} />
                      <span>Deposit</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Add Contribution */}
      {isContribModalOpen && selectedGoalForContrib && (
        <div className={styles.modalBackdrop} onClick={() => setIsContribModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="contrib-modal-title">
            <div className={styles.modalHeader}>
              <h3 id="contrib-modal-title" className={styles.modalTitle}>
                Deposit to {selectedGoalForContrib.title}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsContribModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleContributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="contrib-amt">Contribution Amount (₹)</label>
                <input
                  id="contrib-amt"
                  type="number"
                  min="1"
                  required
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Deposit Date</label>
                <DatePicker
                  value={contribDate}
                  onChange={setContribDate}
                  aria-label="Deposit date"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <Select
                  value={contribMethod}
                  onChange={setContribMethod}
                  options={PAYMENT_METHODS}
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={contribRecordTransfer}
                  onChange={(e) => setContribRecordTransfer(e.target.checked)}
                />
                <span>Record as internal transfer in ledger (does not inflate expenses)</span>
              </label>

              <div className={styles.formGroup}>
                <label htmlFor="contrib-notes">Notes (Optional)</label>
                <input
                  id="contrib-notes"
                  type="text"
                  placeholder="e.g. Monthly salary savings allocation"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsContribModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Record Deposit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: History */}
      {isHistoryModalOpen && selectedGoalHistory && (
        <div className={styles.modalBackdrop} onClick={() => setIsHistoryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="contrib-hist-title">
            <div className={styles.modalHeader}>
              <h3 id="contrib-hist-title" className={styles.modalTitle}>
                {selectedGoalHistory.goal?.title} History
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
                <span style={{ color: '#6B7280' }}>Total Saved:</span>
                <strong style={{ fontFamily: 'monospace', color: '#087F5B' }}>
                  ₹{Number(selectedGoalHistory.goal?.currentAmount || 0).toLocaleString('en-IN')}
                </strong>
              </div>

              {selectedGoalHistory.contributions?.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center', padding: '1rem 0' }}>
                  No deposits recorded yet.
                </p>
              ) : (
                <div className={styles.historyList}>
                  {selectedGoalHistory.contributions?.map((c) => {
                    const contribId = c.id || c._id;
                    const goalId = selectedGoalHistory.goal?.id || selectedGoalHistory.goal?._id;

                    return (
                      <div key={contribId} className={styles.historyItem}>
                        <div className={styles.historyLeft}>
                          <span className={styles.historyAmount}>
                            +₹{Number(c.amount).toLocaleString('en-IN')}
                          </span>
                          <span className={styles.historyDate}>
                            {new Date(c.date || c.contributionDate || c.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            {c.notes ? `• ${c.notes}` : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.reverseBtn}
                          onClick={() => handleReverseContribution(goalId, contribId)}
                          title="Reverse this contribution"
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

      {/* MODAL 3: New Goal */}
      {isNewGoalModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsNewGoalModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-goal-title">
            <div className={styles.modalHeader}>
              <h3 id="new-goal-title" className={styles.modalTitle}>Create Savings Goal</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsNewGoalModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="goal-title">Goal Name</label>
                <input
                  id="goal-title"
                  type="text"
                  placeholder="e.g. New Laptop, Vacation Fund"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-target">Target Amount (₹)</label>
                <input
                  id="goal-target"
                  type="number"
                  min="1"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <Select
                  value={newCategory}
                  onChange={setNewCategory}
                  options={CATEGORIES}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-monthly">Planned Monthly Deposit (₹)</label>
                <input
                  id="goal-monthly"
                  type="number"
                  min="0"
                  placeholder="e.g. 2000"
                  value={newMonthly}
                  onChange={(e) => setNewMonthly(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goal-notes">Notes (Optional)</label>
                <input
                  id="goal-notes"
                  type="text"
                  placeholder="Target date or purpose"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setIsNewGoalModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
