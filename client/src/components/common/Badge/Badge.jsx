import styles from './Badge.module.scss';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClass = styles[variant] || styles.neutral;
  return (
    <span className={`${styles.badge} ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}

