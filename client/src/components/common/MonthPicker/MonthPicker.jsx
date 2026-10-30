import { useState, useRef, useEffect, useId } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import styles from './MonthPicker.module.scss';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Reusable accessible MonthPicker component.
 * Value format: "YYYY-MM" string (e.g. "2026-10") or empty string "".
 * Timezone-safe string parsing and formatting.
 */
export function MonthPicker({
  value = '',
  onChange,
  placeholder = 'All Months',
  allowClear = true,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel = 'Select month and year',
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const generatedId = useId();
  const pickerId = id || generatedId;

  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentCalendarMonth = now.getMonth() + 1; // 1-12

  // Parse value strictly from "YYYY-MM" string to avoid timezone bugs
  const parseYearMonth = (str) => {
    if (!str || typeof str !== 'string' || !str.includes('-')) {
      return { year: currentCalendarYear, month: null, isValid: false };
    }
    const parts = str.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return { year: currentCalendarYear, month: null, isValid: false };
    }
    return { year: y, month: m, isValid: true };
  };

  const parsed = parseYearMonth(value);
  const [viewYear, setViewYear] = useState(() => parsed.year);

  // Synchronize viewYear when value changes externally
  useEffect(() => {
    if (parsed.isValid) {
      setViewYear(parsed.year);
    }
  }, [value, parsed.isValid, parsed.year]);

  // Outside click & Escape listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex) => {
    const monthNum = monthIndex + 1;
    const formatted = `${viewYear}-${String(monthNum).padStart(2, '0')}`;
    onChange?.(formatted);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleThisMonth = () => {
    const formatted = `${currentCalendarYear}-${String(currentCalendarMonth).padStart(2, '0')}`;
    setViewYear(currentCalendarYear);
    onChange?.(formatted);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('');
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Human-readable trigger text
  const displayText = parsed.isValid
    ? `${MONTHS_FULL[parsed.month - 1]} ${parsed.year}`
    : placeholder;

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setAlignRight(window.innerWidth - rect.left < 290);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.pickerContainer} ${styles[size]} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        id={pickerId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={handleToggle}
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${
          disabled ? styles.disabled : ''
        }`}
      >
        <span className={styles.triggerContent}>
          <Calendar size={16} className={styles.calendarIcon} aria-hidden="true" />
          <span
            className={`${styles.labelText} ${
              !parsed.isValid ? styles.placeholderText : ''
            }`}
          >
            {displayText}
          </span>
        </span>

        <div className={styles.triggerIcons}>
          {allowClear && parsed.isValid && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected month"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear();
                }
              }}
              className={styles.clearBtn}
            >
              <X size={14} />
            </span>
          )}
          <span
            className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Month and year picker"
          className={`${styles.popover} ${
            alignRight ? styles.alignRight : styles.alignLeft
          }`}
        >
          {/* Popover Header with Year Navigation */}
          <div className={styles.yearNav}>
            <button
              type="button"
              className={styles.yearNavBtn}
              onClick={() => setViewYear((y) => y - 1)}
              aria-label={`Previous year, ${viewYear - 1}`}
            >
              <ChevronLeft size={16} />
            </button>

            <span className={styles.yearTitle} aria-live="polite">
              {viewYear}
            </span>

            <button
              type="button"
              className={styles.yearNavBtn}
              onClick={() => setViewYear((y) => y + 1)}
              aria-label={`Next year, ${viewYear + 1}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 12-Month Grid */}
          <div className={styles.monthsGrid} role="grid" aria-label={`Months of ${viewYear}`}>
            {MONTHS_SHORT.map((name, index) => {
              const monthNum = index + 1;
              const isSelected =
                parsed.isValid &&
                parsed.year === viewYear &&
                parsed.month === monthNum;
              const isCurrentMonth =
                currentCalendarYear === viewYear &&
                currentCalendarMonth === monthNum;

              return (
                <button
                  key={name}
                  type="button"
                  role="gridcell"
                  aria-pressed={isSelected}
                  aria-label={`${MONTHS_FULL[index]} ${viewYear}${
                    isCurrentMonth ? ' (Current month)' : ''
                  }`}
                  onClick={() => handleSelectMonth(index)}
                  className={`${styles.monthBtn} ${
                    isSelected ? styles.selected : ''
                  } ${isCurrentMonth && !isSelected ? styles.currentMonth : ''}`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.quickActionBtn}
              onClick={handleThisMonth}
            >
              This month
            </button>
            {allowClear && (
              <button
                type="button"
                className={styles.clearActionBtn}
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
