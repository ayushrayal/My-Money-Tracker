import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar/Sidebar';
import { Header } from '../components/navigation/Header/Header';
import { MobileNav } from '../components/navigation/MobileNav/MobileNav';
import styles from './AppLayout.module.scss';

const routeTitles = {
  '/': 'Dashboard Overview',
  '/transactions': 'Transactions',
  '/budgets': 'Budget Planning',
  '/savings': 'Savings Goals',
  '/loans': 'Informal Loans Tracker',
};

export function AppLayout() {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'Money Tracker';

  return (
    <div className={styles.appShell}>
      {/* Keyboard accessible skip-to-content link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <Header title={currentTitle} />

        <main id="main-content" className={styles.mainContent} tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

