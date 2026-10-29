import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  HandCoins,
} from 'lucide-react';
import styles from './MobileNav.module.scss';

const mobileNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/transactions', label: 'History', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/loans', label: 'Loans', icon: HandCoins },
];

export function MobileNav() {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile Navigation">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`.trim()
            }
            end={item.path === '/'}
            aria-label={item.label}
          >
            <span className={styles.iconWrapper} aria-hidden="true">
              <Icon size={20} />
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

