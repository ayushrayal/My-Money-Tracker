import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import styles from './DatePicker.module.scss';

const WEEKDAYS = [
  { short: 'Su', full: 'Sunday' },
  { short: 'Mo', full: 'Monday' },
  { short: 'Tu', full: 'Tuesday' },
  { short: 'We', full: 'Wednesday' },
  { short: 'Th', full: 'Thursday' },
  { short: 'Fr', full: 'Friday' },
  { short: 'Sa', full: 'Saturday' },
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Strict calendar date parser (YYYY-MM-DD) avoiding any timezone offsets.
 */
function parseDateString(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) return null;
  const maxDays = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDays) return null;
  return {
    year,
    month,
    day,
    formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

/**
 * Get local current date without UTC rollover issues.
 */
function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return {
    year,
    month,
    day,
    formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

/**
 * Reusable accessible DatePicker component.
 * Value format: "YYYY-MM-DD" string (e.g. "2026-10-30") or empty string "".
 * Timezone-safe string parsing and formatting.
 *
 * Props:
 * - value: string (YYYY-MM-DD)
 * - onChange: (formattedDate: string) => void
 * - placeholder?: string
 * - allowClear?: boolean
 * - disabled?: boolean
 * - hasError?: boolean
 * - className?: string
 * - id?: string
 * - 'aria-label'?: string
 * - 'aria-labelledby'?: string
 * - size?: 'sm' | 'md'
 */
export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date...',
  allowClear = true,
  disabled = false,
  hasError = false,
  className = '',
  id,
  'aria-label': ariaLabel = 'Select date',
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dayRefs = useRef({});
  const generatedId = useId();
  const pickerId = id || generatedId;
  const dialogId = `${pickerId}-dialog`;

  const today = getLocalToday();
  const parsedValue = parseDateString(value);

  const [viewYear, setViewYear] = useState(() => (parsedValue ? parsedValue.year : today.year));
  const [viewMonth, setViewMonth] = useState(() => (parsedValue ? parsedValue.month : today.month));
  const [focusedDay, setFocusedDay] = useState(() => (parsedValue ? parsedValue.day : today.day));

  // Sync view calendar state when external value changes
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setFocusedDay(parsedValue.day);
    }
  }, [value]);

  // Determine popover position (flip upward if close to bottom viewport edge, align right if near right edge)
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpward(spaceBelow < 330 && spaceAbove > spaceBelow);
    setAlignRight(window.innerWidth - rect.left < 310);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setFocusedDay(parsedValue.day);
    } else {
      setViewYear(today.year);
      setViewMonth(today.month);
      setFocusedDay(today.day);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Close on outside click & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
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

  // Focus the day cell when popover opens or focusedDay changes while open
  useEffect(() => {
    if (isOpen && dayRefs.current[focusedDay]) {
      dayRefs.current[focusedDay]?.focus();
    }
  }, [isOpen, focusedDay, viewMonth, viewYear]);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (formattedDate, targetYear, targetMonth) => {
    onChange?.(formattedDate);
    if (targetYear && targetMonth) {
      setViewYear(targetYear);
      setViewMonth(targetMonth);
    }
    handleClose();
    triggerRef.current?.focus();
  };

  const handleSelectToday = () => {
    const t = getLocalToday();
    setViewYear(t.year);
    setViewMonth(t.month);
    setFocusedDay(t.day);
    onChange?.(t.formatted);
    handleClose();
    triggerRef.current?.focus();
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('');
    handleClose();
    triggerRef.current?.focus();
  };

  // Calendar cells generation for viewYear & viewMonth
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const cells = [];

  // 1. Previous month trailing overflow
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    let prevMonth = viewMonth - 1;
    let prevYear = viewYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    cells.push({
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      formatted: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    cells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      formatted: `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // 3. Next month leading overflow to complete the 7-column grid
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      let nextMonth = viewMonth + 1;
      let nextYear = viewYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      cells.push({
        day: d,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        formatted: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
  }

  // Keyboard navigation inside calendar grid
  const handleGridKeyDown = (e) => {
    let nextDay = focusedDay;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (focusedDay > 1) {
          setFocusedDay(focusedDay - 1);
        } else {
          // Wrap to previous month's last day
          const prevMonthLastDay = new Date(viewYear, viewMonth - 1, 0).getDate();
          handlePrevMonth();
          setFocusedDay(prevMonthLastDay);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (focusedDay < daysInCurrentMonth) {
          setFocusedDay(focusedDay + 1);
        } else {
          // Wrap to next month's 1st day
          handleNextMonth();
          setFocusedDay(1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (focusedDay - 7 >= 1) {
          setFocusedDay(focusedDay - 7);
        } else {
          const prevMonthLastDay = new Date(viewYear, viewMonth - 1, 0).getDate();
          const target = prevMonthLastDay + (focusedDay - 7);
          handlePrevMonth();
          setFocusedDay(Math.max(1, target));
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (focusedDay + 7 <= daysInCurrentMonth) {
          setFocusedDay(focusedDay + 7);
        } else {
          const target = focusedDay + 7 - daysInCurrentMonth;
          handleNextMonth();
          setFocusedDay(target);
        }
        break;

      case 'PageUp':
        e.preventDefault();
        handlePrevMonth();
        break;

      case 'PageDown':
        e.preventDefault();
        handleNextMonth();
        break;

      case 'Home':
        e.preventDefault();
        setFocusedDay(1);
        break;

      case 'End':
        e.preventDefault();
        setFocusedDay(daysInCurrentMonth);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelectDate(
          `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(focusedDay).padStart(2, '0')}`,
          viewYear,
          viewMonth
        );
        break;

      default:
        break;
    }
  };

  // Keyboard on trigger button
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      handleOpen();
    }
  };

  // Human-readable trigger text
  const displayText = parsedValue
    ? `${MONTHS_SHORT[parsedValue.month - 1]} ${parsedValue.day}, ${parsedValue.year}`
    : placeholder;

  const prevMonthName = viewMonth === 1 ? MONTHS_FULL[11] : MONTHS_FULL[viewMonth - 2];
  const nextMonthName = viewMonth === 12 ? MONTHS_FULL[0] : MONTHS_FULL[viewMonth];

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
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${
          hasError ? styles.hasError : ''
        } ${disabled ? styles.disabled : ''}`}
      >
        <span className={styles.triggerContent}>
          <Calendar size={16} className={styles.calendarIcon} aria-hidden="true" />
          <span
            className={`${styles.labelText} ${
              !parsedValue ? styles.placeholderText : ''
            }`}
          >
            {displayText}
          </span>
        </span>

        <div className={styles.triggerIcons}>
          {allowClear && parsedValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected date"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e);
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
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Calendar date picker"
          className={`${styles.popover} ${
            openUpward ? styles.upward : styles.downward
          } ${alignRight ? styles.alignRight : styles.alignLeft}`}
        >
          {/* Header Row: Month/Year navigation */}
          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              aria-label={`Previous month, ${prevMonthName}`}
            >
              <ChevronLeft size={16} />
            </button>

            <span className={styles.monthYearTitle} aria-live="polite">
              {MONTHS_FULL[viewMonth - 1]} {viewYear}
            </span>

            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              aria-label={`Next month, ${nextMonthName}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels Header */}
          <div className={styles.weekdaysRow} role="row">
            {WEEKDAYS.map((wd) => (
              <span
                key={wd.short}
                className={styles.weekday}
                title={wd.full}
                aria-label={wd.full}
              >
                {wd.short}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className={styles.daysGrid}
            role="grid"
            aria-label={`${MONTHS_FULL[viewMonth - 1]} ${viewYear}`}
            onKeyDown={handleGridKeyDown}
          >
            {cells.map((cell) => {
              const isSelected = parsedValue && parsedValue.formatted === cell.formatted;
              const isToday = today.formatted === cell.formatted;
              const isCellFocused = cell.isCurrentMonth && focusedDay === cell.day;

              return (
                <button
                  key={cell.formatted}
                  ref={(el) => {
                    if (cell.isCurrentMonth) {
                      dayRefs.current[cell.day] = el;
                    }
                  }}
                  type="button"
                  role="gridcell"
                  tabIndex={isCellFocused ? 0 : -1}
                  aria-selected={isSelected}
                  aria-label={`${MONTHS_FULL[cell.month - 1]} ${cell.day}, ${cell.year}${
                    isToday ? ' (Today)' : ''
                  }`}
                  onClick={() => handleSelectDate(cell.formatted, cell.year, cell.month)}
                  className={`${styles.dayBtn} ${
                    cell.isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isSelected ? styles.selected : ''} ${
                    isToday && !isSelected ? styles.today : ''
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer: Today & Clear */}
          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.todayActionBtn}
              onClick={handleSelectToday}
            >
              Today
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

