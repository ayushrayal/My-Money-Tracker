import { AlertTriangle } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import styles from './DemoBanner.module.scss';

export function DemoBanner() {
  return (
    <aside className={styles.demoBanner} aria-label="Demo preview notice">
      <div className={styles.content}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <AlertTriangle size={20} />
        </div>
        <div className={styles.textGroup}>
          <div className={styles.title}>
            <span>Phase 1 UI Foundation Mode</span>
            <Badge variant="demo">Demo Data</Badge>
          </div>
          <p className={styles.description}>
            All financial balances, budgets, and transactions below are mock preview figures for responsive layout testing. No database persistence or real records are active.
          </p>
        </div>
      </div>
    </aside>
  );
}

