import styles from './Card.module.scss';

export function Card({
  children,
  title,
  subtitle,
  action,
  footer,
  variant = 'default',
  interactive = false,
  className = '',
  as: Component = 'div',
  ...props
}) {
  const variantClass = variant === 'highlight' ? styles.highlight : '';
  const interactiveClass = interactive ? styles.interactive : '';

  return (
    <Component
      className={`${styles.card} ${variantClass} ${interactiveClass} ${className}`.trim()}
      {...props}
    >
      {(title || subtitle || action) && (
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}

      <div className={styles.body}>{children}</div>

      {footer && <footer className={styles.footer}>{footer}</footer>}
    </Component>
  );
}

