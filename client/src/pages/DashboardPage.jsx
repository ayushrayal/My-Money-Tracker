import { DemoBanner } from '../components/common/DemoBanner/DemoBanner';
import { BalanceSummary } from '../components/dashboard/BalanceSummary/BalanceSummary';
import { SpendingOverview } from '../components/dashboard/SpendingOverview/SpendingOverview';
import { CategoryBudgets } from '../components/dashboard/CategoryBudgets/CategoryBudgets';
import { RecentTransactions } from '../components/dashboard/RecentTransactions/RecentTransactions';
import { ServerStatusCard } from '../components/dashboard/ServerStatusCard/ServerStatusCard';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  return (
    <div className={styles.dashboardContainer}>
      {/* Clear indicator that data is demo preview only */}
      <DemoBanner />

      {/* Balance Summary Cards */}
      <BalanceSummary />

      {/* Main Dashboard Responsive Grid */}
      <div className={styles.dashboardGrid}>
        <div className={styles.primaryColumn}>
          <SpendingOverview />
          <CategoryBudgets />
        </div>

        <div className={styles.secondaryColumn}>
          <RecentTransactions />
          <ServerStatusCard />
        </div>
      </div>
    </div>
  );
}

