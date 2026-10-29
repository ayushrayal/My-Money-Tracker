import { HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge/Badge';
import { Button } from '../components/common/Button/Button';
import styles from './PlaceholderPage.module.scss';

export function LoansPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.iconCircle} aria-hidden="true">
        <HandCoins size={28} />
      </div>
      <Badge variant="warning">Phase 2 Scheduled</Badge>
      <h2 className={styles.title}>Informal Loans Tracker</h2>
      <p className={styles.description}>
        Track money lent to friends, relatives, or borrowed informally, complete with expected return dates, partial repayment tracking, and balance reminders.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

