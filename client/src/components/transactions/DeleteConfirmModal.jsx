import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button/Button';
import styles from './DeleteConfirmModal.module.scss';

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  isDeleting,
}) {
  const cancelBtnRef = useRef(null);

  // Keyboard Escape listener & scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    // Focus cancel button for safe keyboard interaction
    const timeoutId = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !transaction) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className={styles.modal}>
        <div className={styles.iconCircle} aria-hidden="true">
          <AlertTriangle size={24} />
        </div>

        <h2 id="delete-dialog-title" className={styles.title}>
          Delete Transaction?
        </h2>

        <p className={styles.description}>
          Are you sure you want to delete this record? This action cannot be undone and will update your spending summaries immediately.
        </p>

        <div className={styles.itemSummary}>
          <strong>{transaction.description}</strong>
          <span>₹{Number(transaction.amount).toFixed(2)}</span>
        </div>

        <div className={styles.footer}>
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
