import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  HandCoins,
  Wallet,
} from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import styles from './Sidebar.module.scss';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/loans', label: 'Informal Loans', icon: HandCoins },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Desktop Primary Navigation">
      <div className={styles.brand}>
        <div className={styles.logoIcon} aria-hidden="true">
          <Wallet size={20} />
        </div>
        <div className={styles.brandText}>
          <span className={styles.appName}>Money Tracker</span>
          <span className={styles.appTagline}>Personal Finance</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Main Navigation">
        <span className={styles.navSectionTitle}>Main Menu</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`.trim()
              }
              end={item.path === '/'}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.versionBadge}>
          <span>Ledger Vault</span>
          <Badge variant="income">Active</Badge>
        </div>
      </div>
    </aside>
  );
}

