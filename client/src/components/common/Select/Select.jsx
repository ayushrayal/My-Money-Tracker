import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.scss';

/**
 * Reusable accessible Select component.
 * Follows WAI-ARIA Combobox / Listbox pattern.
 *
 * Props:
 * - value: string | number
 * - onChange: (value) => void
 * - options: Array<{ value: string|number, label: string, secondary?: string, icon?: React.ComponentType, disabled?: boolean }>
 * - placeholder?: string
 * - disabled?: boolean
 * - hasError?: boolean
 * - className?: string
 * - id?: string
 * - name?: string
 * - 'aria-label'?: string
 * - 'aria-labelledby'?: string
 * - size?: 'sm' | 'md'
 */
export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  hasError = false,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  // Normalize options to objects
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? opt
      : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Auto-scroll highlighted option into view
  const scrollOptionIntoView = useCallback((index) => {
    if (!listboxRef.current) return;
    const item = listboxRef.current.children[index];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  // Determine popover flip (upward if close to bottom viewport edge)
  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // If less than 280px below and more space above, open upward
    setOpenUpward(spaceBelow < 280 && spaceAbove > spaceBelow);
  };

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
    // Highlight currently selected option, or first non-disabled option
    const currentIndex = normalizedOptions.findIndex(
      (opt) => String(opt.value) === String(value)
    );
    const initialIndex = currentIndex >= 0 ? currentIndex : 0;
    setHighlightedIndex(initialIndex);
  };

  const handleClose = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange(opt.value);
    handleClose();
    triggerRef.current?.focus();
  };

  // Outside click detection
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
      case 'Tab':
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;

      case 'ArrowDown': {
        e.preventDefault();
        let nextIndex = highlightedIndex + 1;
        while (
          nextIndex < normalizedOptions.length &&
          normalizedOptions[nextIndex]?.disabled
        ) {
          nextIndex++;
        }
        if (nextIndex < normalizedOptions.length) {
          setHighlightedIndex(nextIndex);
          scrollOptionIntoView(nextIndex);
        }
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        let prevIndex = highlightedIndex - 1;
        while (prevIndex >= 0 && normalizedOptions[prevIndex]?.disabled) {
          prevIndex--;
        }
        if (prevIndex >= 0) {
          setHighlightedIndex(prevIndex);
          scrollOptionIntoView(prevIndex);
        }
        break;
      }

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        scrollOptionIntoView(0);
        break;

      case 'End':
        e.preventDefault();
        setHighlightedIndex(normalizedOptions.length - 1);
        scrollOptionIntoView(normalizedOptions.length - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < normalizedOptions.length
        ) {
          const selected = normalizedOptions[highlightedIndex];
          if (!selected.disabled) {
            handleSelect(selected);
          }
        }
        break;

      default:
        break;
    }
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div
      ref={containerRef}
      className={`${styles.selectContainer} ${styles[size]} ${className}`.trim()}
    >
      {/* Hidden input for HTML form submissions if name provided */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0
            ? `${listboxId}-opt-${highlightedIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${
          hasError ? styles.hasError : ''
        } ${disabled ? styles.disabled : ''}`}
      >
        <span className={styles.selectedContent}>
          {SelectedIcon && (
            <SelectedIcon size={16} className={styles.leadingIcon} aria-hidden="true" />
          )}
          <span
            className={`${styles.labelText} ${
              !selectedOption ? styles.placeholderText : ''
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.secondary && (
            <span className={styles.secondaryBadge}>
              {selectedOption.secondary}
            </span>
          )}
        </span>

        <span
          className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
          aria-hidden="true"
        >
          <ChevronDown size={16} />
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          className={`${styles.menu} ${openUpward ? styles.upward : styles.downward}`}
        >
          {normalizedOptions.length === 0 ? (
            <li className={styles.emptyState} role="presentation">
              No options available
            </li>
          ) : (
            normalizedOptions.map((opt, index) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = highlightedIndex === index;
              const OptionIcon = opt.icon;

              return (
                <li
                  key={`${opt.value}-${index}`}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  title={opt.label}
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => {
                    if (!opt.disabled) setHighlightedIndex(index);
                  }}
                  className={`${styles.option} ${
                    isSelected ? styles.selected : ''
                  } ${isHighlighted ? styles.highlighted : ''} ${
                    opt.disabled ? styles.disabledOption : ''
                  }`}
                >
                  <div className={styles.optionContent}>
                    {OptionIcon && (
                      <OptionIcon
                        size={15}
                        className={styles.optionIcon}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.optionLabel}>{opt.label}</span>
                    {opt.secondary && (
                      <span className={styles.optionSecondary}>
                        {opt.secondary}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      className={styles.checkIcon}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
