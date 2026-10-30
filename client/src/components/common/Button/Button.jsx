import { forwardRef } from 'react';
import styles from './Button.module.scss';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    iconOnly = false,
    className = '',
    type = 'button',
    disabled = false,
    onClick,
    ...props
  },
  ref
) {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = size === 'sm' ? styles.sm : '';
  const iconClass = iconOnly ? styles.iconOnly : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${variantClass} ${sizeClass} ${iconClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});
