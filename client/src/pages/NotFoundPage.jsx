import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button/Button';
import styles from './PlaceholderPage.module.scss';

export function NotFoundPage() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.iconCircle} style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }} aria-hidden="true">
        <AlertCircle size={28} />
      </div>
      <h2 className={styles.title}>404 - Page Not Found</h2>
      <p className={styles.description}>
        The page you are looking for does not exist or has moved.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

