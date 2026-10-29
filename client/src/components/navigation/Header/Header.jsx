import { Calendar, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import styles from './Header.module.scss';

export function Header({ title = 'Dashboard' }) {
  const { user, logout } = useAuth();

  // Current month formatting
  const currentMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const getInitials = (name) => {
    if (!name) return 'MT';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerInner}>
        <div className={styles.leftSection}>
          <div className={styles.mobileBrand}>
            <div className={styles.mobileLogo} aria-hidden="true">
              <Wallet size={18} />
            </div>
            <span className={styles.mobileTitle}>Money Tracker</span>
          </div>
          <h1 className={styles.desktopTitle}>{title}</h1>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.dateFilter} title="Active billing cycle">
            <Calendar size={14} aria-hidden="true" />
            <span>{currentMonthYear}</span>
          </div>

          <div className={styles.userControls}>
            <div
              className={styles.avatar}
              title={user ? `${user.name} (${user.email})` : 'User Profile'}
              role="img"
              aria-label={user ? `${user.name}'s avatar` : 'User avatar'}
            >
              {getInitials(user?.name)}
            </div>

            {user && (
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={logout}
                title="Log out of your account"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
