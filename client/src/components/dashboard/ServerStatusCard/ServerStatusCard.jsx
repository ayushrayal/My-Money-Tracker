import { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchHealthStatus } from '../../../services/healthService';
import { Badge } from '../../common/Badge/Badge';
import { Button } from '../../common/Button/Button';
import styles from './ServerStatusCard.module.scss';

export function ServerStatusCard() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [healthData, setHealthData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const checkStatus = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await fetchHealthStatus();
      setHealthData(data);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to connect to backend server');
      setStatus('error');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const isOnline = status === 'success';

  return (
    <div className={styles.card} aria-label="Backend API Health Connection">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div
            className={`${styles.statusIndicator} ${
              status === 'loading'
                ? styles.loading
                : isOnline
                ? styles.online
                : styles.offline
            }`}
            aria-hidden="true"
          />
          <h2 className={styles.title}>Backend Health Status (GET /api/health)</h2>
        </div>
        <Badge variant={isOnline ? 'income' : status === 'loading' ? 'warning' : 'expense'}>
          {status === 'loading' ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <p className={styles.description}>
        Verifies live communication between this React frontend and the Express REST API via the Vite reverse proxy.
      </p>

      {isOnline && healthData && (
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailKey}>Service:</span>
            <span className={styles.detailVal}>{healthData.service}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailKey}>Environment:</span>
            <span className={styles.detailVal}>{healthData.environment}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailKey}>Uptime:</span>
            <span className={styles.detailVal}>{healthData.uptimeSeconds}s</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailKey}>Version:</span>
            <span className={styles.detailVal}>v{healthData.version}</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorBox} role="alert">
          <strong>Connection issue: </strong>
          {errorMessage}. Make sure the Express server is running.
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={status === 'loading'}
        >
          <RefreshCw size={14} className={status === 'loading' ? 'spin' : ''} />
          <span>Re-check Health</span>
        </Button>
      </div>
    </div>
  );
}

