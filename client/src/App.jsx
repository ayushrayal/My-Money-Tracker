import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { DashboardPage } from './pages/DashboardPage';

// Lazy-load non-critical secondary routes for optimized performance
const TransactionsPage = lazy(() =>
  import('./pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage }))
);
const BudgetsPage = lazy(() =>
  import('./pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage }))
);
const SavingsPage = lazy(() =>
  import('./pages/SavingsPage').then((m) => ({ default: m.SavingsPage }))
);
const LoansPage = lazy(() =>
  import('./pages/LoansPage').then((m) => ({ default: m.LoansPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function RouteSuspenseFallback() {
  return (
    <div
      style={{
        padding: '3rem 1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#6B7280',
        fontSize: '0.875rem',
      }}
      role="status"
    >
      Loading view...
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="savings" element={<SavingsPage />} />
                <Route path="loans" element={<LoansPage />} />
              </Route>
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
