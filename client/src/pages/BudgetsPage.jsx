import { PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge/Badge';
import { Button } from '../components/common/Button/Button';
import styles from './PlaceholderPage.module.scss';

export function BudgetsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.iconCircle} aria-hidden="true">
        <PieChart size={28} />
      </div>
      <Badge variant="warning">Phase 2 Scheduled</Badge>
      <h2 className={styles.title}>Budget Limits & Pacing</h2>
      <p className={styles.description}>
        Custom category budget limits, alerts when reaching 80% and 100% threshold, and rollover allocations are scheduled for Phase 2.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

