import { Sparkles } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import styles from './DemoBanner.module.scss';

export function DemoBanner() {
  return (
    <aside className={styles.demoBanner} aria-label="Phase 4 financial suite notice">
      <div className={styles.content}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <Sparkles size={20} />
        </div>
        <div className={styles.textGroup}>
          <div className={styles.title}>
            <span>Phase 4: Full Financial Suite Active</span>
            <Badge variant="income">Salary • Budgets • Loans • Savings</Badge>
          </div>
          <p className={styles.description}>
            Persistent salary receipt tracking, monthly category budget limits with 80% &amp; 100% threshold indicators, informal loan debt tracking, and emergency fund milestone goals are fully enabled and linked to your ledger.
          </p>
        </div>
      </div>
    </aside>
  );
}
