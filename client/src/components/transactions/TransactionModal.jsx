import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button/Button';
import { Select } from '../common/Select/Select';
import { DatePicker } from '../common/DatePicker/DatePicker';
import styles from './TransactionModal.module.scss';

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

/**
 * Timezone-safe date string formatter for "YYYY-MM-DD"
 */
function formatToDateInputString(val) {
  if (!val) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  categories = [],
  defaultType = 'expense',
}) {
  const isEditing = Boolean(initialData);
  const amountInputRef = useRef(null);

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [date, setDate] = useState(() => formatToDateInputString());
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset form when opened / initialData changed
  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setDescription(initialData.description || '');
      setCategory(
        initialData.category?._id ||
        (typeof initialData.category === 'string' ? initialData.category : '')
      );
      setPaymentMethod(initialData.paymentMethod || 'upi');
      setDate(formatToDateInputString(initialData.date));
      setNotes(initialData.notes || '');
    } else {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setCategory('');
      setPaymentMethod('upi');
      setDate(formatToDateInputString());
      setNotes('');
    }
    setErrorMessage('');
    setFieldErrors({});
  }, [initialData, isOpen, defaultType]);

  // Keyboard Escape listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    // Auto-focus amount input for high-speed data entry
    const timeoutId = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 50);

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Filter categories matching active type
  const availableCategories = categories.filter((c) => c.type === type);

  // Auto-select first matching category if none selected
  useEffect(() => {
    if (type !== 'transfer' && !category && availableCategories.length > 0) {
      setCategory(availableCategories[0].id || availableCategories[0]._id);
    }
  }, [type, availableCategories, category]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (numericAmount > 100000000) {
      errors.amount = 'Amount cannot exceed 100,000,000';
    }

    if (!description || description.trim().length === 0) {
      errors.description = 'Description is required';
    }

    if (type !== 'transfer' && !category) {
      errors.category = 'Please select a category';
    }

    if (!date) {
      errors.date = 'Date is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        paymentMethod,
        date: date.includes('T') ? new Date(date).toISOString() : new Date(`${date}T00:00:00.000Z`).toISOString(),
        notes: notes.trim(),
      };

      if (type !== 'transfer' && category) {
        payload.category = category;
      } else {
        payload.category = null;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      if (err.details?.error?.fields) {
        setFieldErrors(err.details.error.fields);
      }
      setErrorMessage(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <h2 id="modal-title" className={styles.modalTitle}>
              {isEditing ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <span className={styles.modalSubtitle}>
              {type === 'transfer'
                ? 'Internal transfer between accounts'
                : `Record new ${type}`}
            </span>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className={styles.serverAlert} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Scrollable form body */}
          <div className={styles.scrollBody}>
            {/* Segmented Type Selector */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Transaction Type</label>
              <div className={styles.typeSelector} role="radiogroup" aria-label="Transaction Type">
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === 'expense' ? styles.activeExpense : ''}`}
                  onClick={() => {
                    setType('expense');
                    setCategory('');
                  }}
                  disabled={isSubmitting}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
                  onClick={() => {
                    setType('income');
                    setCategory('');
                  }}
                  disabled={isSubmitting}
                >
                  Income
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === 'transfer' ? styles.activeTransfer : ''}`}
                  onClick={() => {
                    setType('transfer');
                    setCategory('');
                  }}
                  disabled={isSubmitting}
                >
                  Transfer
                </button>
              </div>
            </div>

            {/* Amount & Date */}
            <div className={styles.rowTwo}>
              <div className={styles.fieldGroup}>
                <label htmlFor="tx-amount" className={styles.label}>
                  Amount (₹) *
                </label>
                <div className={styles.currencyInputWrapper}>
                  <span className={styles.currencySymbol} aria-hidden="true">₹</span>
                  <input
                    ref={amountInputRef}
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: null }));
                    }}
                    className={`${styles.input} ${styles.inputWithSymbol} ${fieldErrors.amount ? styles.hasError : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.amount && (
                  <span className={styles.fieldError} role="alert">{fieldErrors.amount}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="tx-date" className={styles.label}>
                  Date *
                </label>
                <DatePicker
                  id="tx-date"
                  value={date}
                  onChange={(val) => {
                    setDate(val);
                    if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: null }));
                  }}
                  hasError={Boolean(fieldErrors.date)}
                  disabled={isSubmitting}
                  placeholder="Select date"
                  aria-label="Transaction date"
                />
                {fieldErrors.date && (
                  <span className={styles.fieldError} role="alert">{fieldErrors.date}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className={styles.fieldGroup}>
              <label htmlFor="tx-desc" className={styles.label}>
                Description *
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                placeholder="e.g. Supermarket, Salary, Coffee"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: null }));
                }}
                className={`${styles.input} ${fieldErrors.description ? styles.hasError : ''}`}
                disabled={isSubmitting}
              />
              {fieldErrors.description && (
                <span className={styles.fieldError} role="alert">{fieldErrors.description}</span>
              )}
            </div>

            {/* Category (for Income/Expense) & Payment Method */}
            <div className={styles.rowTwo}>
              {type !== 'transfer' ? (
                <div className={styles.fieldGroup}>
                  <label htmlFor="tx-category" className={styles.label}>
                    Category *
                  </label>
                  <Select
                    id="tx-category"
                    value={category}
                    onChange={(val) => {
                      setCategory(val);
                      if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: null }));
                    }}
                    options={availableCategories.map((cat) => ({
                      value: cat.id || cat._id,
                      label: cat.name,
                    }))}
                    placeholder="Select Category"
                    hasError={Boolean(fieldErrors.category)}
                    disabled={isSubmitting}
                    aria-label="Select transaction category"
                  />
                  {fieldErrors.category && (
                    <span className={styles.fieldError} role="alert">{fieldErrors.category}</span>
                  )}
                </div>
              ) : (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Category</label>
                  <input
                    type="text"
                    value="Account Transfer (Excluded from budget)"
                    disabled
                    className={styles.input}
                    style={{ opacity: 0.75, cursor: 'not-allowed', backgroundColor: '#F9FAFB' }}
                  />
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label htmlFor="tx-paymentMethod" className={styles.label}>
                  Payment Method *
                </label>
                <Select
                  id="tx-paymentMethod"
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val)}
                  options={PAYMENT_METHODS}
                  disabled={isSubmitting}
                  aria-label="Select payment method"
                />
              </div>
            </div>

            {/* Notes */}
            <div className={styles.fieldGroup}>
              <label htmlFor="tx-notes" className={styles.label}>
                Notes (Optional)
              </label>
              <textarea
                id="tx-notes"
                placeholder="Optional memo, tags or transaction notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
                disabled={isSubmitting}
                maxLength={500}
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Update Transaction'
                : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
