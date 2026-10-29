import { PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge/Badge';
import { Button } from '../components/common/Button/Button';
import styles from './PlaceholderPage.module.scss';

export function SavingsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.iconCircle} aria-hidden="true">
        <PiggyBank size={28} />
      </div>
      <Badge variant="warning">Phase 2 Scheduled</Badge>
      <h2 className={styles.title}>Savings Goals & Emergency Fund</h2>
      <p className={styles.description}>
        Target-based savings funds, deposit milestones, and automated salary allocation will be implemented in subsequent phases.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

