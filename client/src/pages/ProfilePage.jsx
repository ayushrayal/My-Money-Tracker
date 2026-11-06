import { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Calendar,
  LogOut,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import styles from './ProfilePage.module.scss';

const CURRENCIES = [
  { code: 'INR', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', label: 'USD ($) — US Dollar' },
  { code: 'EUR', label: 'EUR (€) — Euro' },
  { code: 'GBP', label: 'GBP (£) — British Pound' },
  { code: 'CAD', label: 'CAD ($) — Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) — Australian Dollar' },
  { code: 'JPY', label: 'JPY (¥) — Japanese Yen' },
  { code: 'SGD', label: 'SGD ($) — Singapore Dollar' },
  { code: 'CHF', label: 'CHF (Fr) — Swiss Franc' },
];

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [createdAt, setCreatedAt] = useState(null);

  // Preference fields
  const [currency, setCurrency] = useState('INR');
  const [budgetStartDay, setBudgetStartDay] = useState(1);
  const [defaultSalary, setDefaultSalary] = useState(25000);
  const [dashboardCards, setDashboardCards] = useState(true);
  const [dashboardTrends, setDashboardTrends] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [loanReminders, setLoanReminders] = useState(true);
  const [savingsMilestones, setSavingsMilestones] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Feedback states
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [prefMsg, setPrefMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await profileService.getProfile();
        if (data) {
          setName(data.name || '');
          setEmail(data.email || '');
          setAvatar(data.avatar || '');
          setCreatedAt(data.createdAt);
          if (data.preferences) {
            setCurrency(data.preferences.currency || data.currency || 'INR');
            setBudgetStartDay(data.preferences.budgetStartDay || 1);
            setDefaultSalary(data.preferences.defaultSalary || 25000);
            if (data.preferences.dashboard) {
              setDashboardCards(data.preferences.dashboard.showSummaryCards !== false);
              setDashboardTrends(data.preferences.dashboard.showTrends !== false);
            }
            if (data.preferences.notifications) {
              setBudgetAlerts(data.preferences.notifications.budgetAlerts !== false);
              setLoanReminders(data.preferences.notifications.loanReminders !== false);
              setSavingsMilestones(data.preferences.notifications.savingsMilestones !== false);
            }
          }
        }
      } catch (err) {
        setProfileMsg({ type: 'error', text: 'Failed to load profile data.' });
      }
    }
    loadData();
  }, []);

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setIsSavingProfile(true);

    try {
      await profileService.updateProfile({ name, email, avatar });
      setProfileMsg({ type: 'success', text: 'Profile details saved successfully!' });
      await refreshUser();
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setPrefMsg({ type: '', text: '' });
    setIsSavingPref(true);

    try {
      await profileService.updatePreferences({
        currency,
        budgetStartDay: Number(budgetStartDay),
        defaultSalary: Number(defaultSalary),
        dashboard: {
          showSummaryCards: dashboardCards,
          showTrends: dashboardTrends,
        },
        notifications: {
          budgetAlerts,
          loanReminders,
          savingsMilestones,
        },
      });
      setPrefMsg({ type: 'success', text: 'Financial preferences saved successfully!' });
      await refreshUser();
    } catch (err) {
      setPrefMsg({ type: 'error', text: err.message || 'Failed to update preferences.' });
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPassMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPassMsg({
        type: 'error',
        text: 'New password must include at least one uppercase letter and one digit.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPass(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      setPassMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className={styles.profileContainer}>
      {/* Top Overview Card */}
      <div className={styles.headerCard}>
        <div className={styles.userOverview}>
          <div className={styles.avatarLarge}>
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              getInitials(name || user?.name)
            )}
          </div>
          <div className={styles.userDetails}>
            <h2>{name || user?.name || 'Account'}</h2>
            <p>{email || user?.email}</p>
            <span className={styles.memberBadge}>
              <Calendar size={12} /> Member since {formattedDate}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className={styles.submitBtn}
          style={{ backgroundColor: '#fff', color: '#E03131', border: '1px solid #E5E7EB' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className={styles.gridSection}>
        {/* Profile Settings */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <User size={18} className={styles.headerIcon} />
            <h3>Personal Information</h3>
          </div>

          {profileMsg.text && (
            <div className={`${styles.alertBox} ${styles[profileMsg.type]}`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={60}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userEmail">Email Address</label>
              <input
                id="userEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className={styles.fieldHint}>Used for authentication and sign in.</span>
            </div>

            <div className={styles.actionsRow}>
              <button type="submit" disabled={isSavingProfile} className={styles.submitBtn}>
                <Save size={16} /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Shield size={18} className={styles.headerIcon} />
            <h3>Security & Password</h3>
          </div>

          {passMsg.text && (
            <div className={`${styles.alertBox} ${styles[passMsg.type]}`}>
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label htmlFor="currPass">Current Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="currPass"
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleVisibilityBtn}
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPass">New Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="newPass"
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={styles.toggleVisibilityBtn}
                  onClick={() => setShowNewPass(!showNewPass)}
                  aria-label="Toggle new password visibility"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className={styles.fieldHint}>Min 8 characters with 1 uppercase letter and 1 number.</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confPass">Confirm New Password</label>
              <input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.actionsRow}>
              <button type="submit" disabled={isChangingPass} className={styles.submitBtn}>
                <Shield size={16} /> {isChangingPass ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Financial Preferences */}
        <div className={`${styles.sectionCard} ${styles.fullWidth}`}>
          <div className={styles.sectionHeader}>
            <Settings size={18} className={styles.headerIcon} />
            <h3>Financial Preferences</h3>
          </div>

          {prefMsg.text && (
            <div className={`${styles.alertBox} ${styles[prefMsg.type]}`}>
              {prefMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdatePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="currencySelect">Currency Display</label>
                <select
                  id="currencySelect"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className={styles.fieldHint}>Default currency used across dashboards & reports.</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="budgetStartDayInput">Monthly Budget Cycle Start Day</label>
                <input
                  id="budgetStartDayInput"
                  type="number"
                  min={1}
                  max={28}
                  value={budgetStartDay}
                  onChange={(e) => setBudgetStartDay(e.target.value)}
                />
                <span className={styles.fieldHint}>Day 1–28 of the month when your salary/budget resets.</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="defaultSalaryInput">Default Expected Salary (₹)</label>
                <input
                  id="defaultSalaryInput"
                  type="number"
                  min={0}
                  step={500}
                  value={defaultSalary}
                  onChange={(e) => setDefaultSalary(e.target.value)}
                />
                <span className={styles.fieldHint}>Used as template for new monthly budgets.</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#1F2937' }}>
                In-App Notification Preferences
              </h4>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span>Budget Threshold Alerts</span>
                  <small>Receive notifications when category spending reaches 80% and 100% of limits</small>
                </div>
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                />
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span>Loan Repayment Reminders</span>
                  <small>Get notified for scheduled loan repayments and completed loan settlements</small>
                </div>
                <input
                  type="checkbox"
                  checked={loanReminders}
                  onChange={(e) => setLoanReminders(e.target.checked)}
                />
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span>Savings Goal Milestones</span>
                  <small>Celebrate and record milestones when savings targets are hit</small>
                </div>
                <input
                  type="checkbox"
                  checked={savingsMilestones}
                  onChange={(e) => setSavingsMilestones(e.target.checked)}
                />
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button type="submit" disabled={isSavingPref} className={styles.submitBtn}>
                <Save size={16} /> {isSavingPref ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

