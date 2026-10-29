import { ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge/Badge';
import { Button } from '../components/common/Button/Button';
import styles from './PlaceholderPage.module.scss';

export function TransactionsPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.iconCircle} aria-hidden="true">
        <ArrowLeftRight size={28} />
      </div>
      <Badge variant="warning">Phase 2 Scheduled</Badge>
      <h2 className={styles.title}>Transactions Management</h2>
      <p className={styles.description}>
        Detailed transaction history, category filtering, search, and CRUD operations will be connected to the MongoDB database in Phase 2.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

