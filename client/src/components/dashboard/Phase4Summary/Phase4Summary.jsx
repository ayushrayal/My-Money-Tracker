import { Link } from 'react-router-dom';
import {
  Wallet,
  PieChart,
  HandCoins,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './Phase4Summary.module.scss';

export function Phase4Summary({ summaryData }) {
  const salary = summaryData?.salary;
  const budget = summaryData?.budget;
  const loans = summaryData?.loans;
  const savings = summaryData?.savings;

  return (
    <section className={styles.suiteGrid} aria-label="Integrated Financial Suite Modules">
      {/* 1. Monthly Salary */}
      <Link to="/budgets" className={styles.suiteCard} aria-label="View Monthly Salary Inflow">
        <div className={styles.cardTop}>
          <div className={styles.iconTitleGroup}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <Wallet size={16} />
            </div>
            <span className={styles.cardTitle}>Monthly Salary</span>
          </div>
          {salary?.status === 'received' ? (
            <Badge variant="income">
              <CheckCircle2 size={12} /> Received
            </Badge>
          ) : (
            <Badge variant="warning">
              <Clock size={12} /> Planned
            </Badge>
          )}
        </div>

        <div className={styles.cardMain}>
          <span className={styles.mainAmount}>
            ₹{Number(salary?.receivedAmount || salary?.plannedAmount || 25000).toLocaleString('en-IN')}
          </span>
          <span className={styles.mainSubtext}>
            {salary?.status === 'received'
              ? `Credited via ${salary?.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}`
              : 'Awaiting monthly salary credit'}
          </span>
        </div>

        <div className={styles.cardFooter}>
          <span>Manage Inflow</span>
          <ChevronRight size={14} />
        </div>
      </Link>

      {/* 2. Budget Pacing */}
      <Link to="/budgets" className={styles.suiteCard} aria-label="View Monthly Budget Pacing">
        <div className={styles.cardTop}>
          <div className={styles.iconTitleGroup}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <PieChart size={16} />
            </div>
            <span className={styles.cardTitle}>Budget Pacing</span>
          </div>
          {budget ? (
            budget.percentUsed >= 100 ? (
              <Badge variant="expense">
                <AlertTriangle size={12} /> Over Limit
              </Badge>
            ) : budget.percentUsed >= 80 ? (
              <Badge variant="warning">
                <Clock size={12} /> {budget.percentUsed}%
              </Badge>
            ) : (
              <Badge variant="income">{budget.percentUsed}% Used</Badge>
            )
          ) : (
            <Badge variant="neutral">Not configured</Badge>
          )}
        </div>

        <div className={styles.cardMain}>
          <span className={styles.mainAmount} style={{ color: (budget?.remainingBudget || 0) < 0 ? '#DC2626' : '#1F2937' }}>
            ₹{Number(budget?.remainingBudget ?? 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.mainSubtext}>
            Remaining of ₹{Number(budget?.totalAllocated || 0).toLocaleString('en-IN')} budget
          </span>
        </div>

        {budget && (
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={budget.percentUsed} aria-valuemin="0" aria-valuemax="100">
            <div
              className={`${styles.progressFill} ${
                budget.percentUsed >= 100
                  ? styles.dangerFill
                  : budget.percentUsed >= 80
                  ? styles.warningFill
                  : ''
              }`}
              style={{ width: `${Math.min(100, Math.max(0, budget.percentUsed))}%` }}
            />
          </div>
        )}

        <div className={styles.cardFooter}>
          <span>View Category Limits</span>
          <ChevronRight size={14} />
        </div>
      </Link>

      {/* 3. Informal Loans Debt */}
      <Link to="/loans" className={styles.suiteCard} aria-label="View Informal Loans Tracker">
        <div className={styles.cardTop}>
          <div className={styles.iconTitleGroup}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <HandCoins size={16} />
            </div>
            <span className={styles.cardTitle}>Informal Debt</span>
          </div>
          {loans && loans.totalOutstanding > 0 ? (
            <Badge variant="warning">{loans.activeLoansCount} Active</Badge>
          ) : (
            <Badge variant="income">All Cleared</Badge>
          )}
        </div>

        <div className={styles.cardMain}>
          <span className={styles.mainAmount} style={{ color: (loans?.totalOutstanding || 0) > 0 ? '#DC2626' : '#087F5B' }}>
            ₹{Number(loans?.totalOutstanding || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.mainSubtext}>
            Planned: ₹{Number(loans?.totalPlannedMonthly || 5000).toLocaleString('en-IN')}/mo
          </span>
        </div>

        <div className={styles.cardFooter}>
          <span>Repayment Schedule</span>
          <ChevronRight size={14} />
        </div>
      </Link>

      {/* 4. Emergency Fund */}
      <Link to="/savings" className={styles.suiteCard} aria-label="View Emergency Fund Goals">
        <div className={styles.cardTop}>
          <div className={styles.iconTitleGroup}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <ShieldCheck size={16} />
            </div>
            <span className={styles.cardTitle}>Emergency Fund</span>
          </div>
          {savings?.emergencyFund?.isMilestoneMet ? (
            <Badge variant="income">
              <CheckCircle2 size={12} /> ₹10k Met
            </Badge>
          ) : (
            <Badge variant="info">₹10k Milestone</Badge>
          )}
        </div>

        <div className={styles.cardMain}>
          <span className={styles.mainAmount} style={{ color: '#087F5B' }}>
            ₹{Number(savings?.totalCurrent || 0).toLocaleString('en-IN')}
          </span>
          <span className={styles.mainSubtext}>
            Target: ₹{Number(savings?.emergencyFund?.targetAmount || savings?.totalTarget || 30000).toLocaleString('en-IN')}
          </span>
        </div>

        {savings && (
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={savings.overallProgress} aria-valuemin="0" aria-valuemax="100">
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, Math.max(0, savings.overallProgress || 0))}%` }}
            />
          </div>
        )}

        <div className={styles.cardFooter}>
          <span>Savings Milestones</span>
          <ChevronRight size={14} />
        </div>
      </Link>
    </section>
  );
}

