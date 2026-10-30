import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, AlertCircle, Check, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button/Button';
import { Select } from '../../components/common/Select/Select';
import styles from './Auth.module.scss';

const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'INR', label: 'INR (₹)' },
  { code: 'CAD', label: 'CAD ($)' },
  { code: 'AUD', label: 'AUD ($)' },
  { code: 'JPY', label: 'JPY (¥)' },
];

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Dynamic password criteria validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const validate = () => {
    const errors = {};
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!isPasswordValid) {
      errors.password = 'Please fulfill all password requirements below.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, currency });
      navigate('/', { replace: true });
    } catch (error) {
      if (error.details?.error?.fields) {
        setFieldErrors(error.details.error.fields);
      }
      setErrorMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <header className={styles.brandHeader}>
          <div className={styles.logoIcon} aria-hidden="true">
            <Wallet size={24} />
          </div>
          <h1 className={styles.title}>Create Your Account</h1>
          <p className={styles.subtitle}>Start tracking your finances privately</p>
        </header>

        {errorMessage && (
          <div className={styles.serverAlert} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-name" className={styles.label}>
              Full Name
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                }}
                className={`${styles.input} ${fieldErrors.name ? styles.hasError : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.name && (
              <span className={styles.fieldError} role="alert">{fieldErrors.name}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="signup-email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                className={`${styles.input} ${fieldErrors.email ? styles.hasError : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.email && (
              <span className={styles.fieldError} role="alert">{fieldErrors.email}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="signup-password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
                className={`${styles.input} ${styles.withIconRight} ${
                  fieldErrors.password ? styles.hasError : ''
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className={styles.fieldError} role="alert">{fieldErrors.password}</span>
            )}

            {/* Live Password Requirements Checklist */}
            <ul className={styles.passwordChecklist} aria-label="Password requirements">
              <li className={hasMinLength ? styles.met : styles.unmet}>
                {hasMinLength ? <Check size={13} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
                <span>At least 8 characters</span>
              </li>
              <li className={hasUppercase ? styles.met : styles.unmet}>
                {hasUppercase ? <Check size={13} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
                <span>At least one uppercase letter (A-Z)</span>
              </li>
              <li className={hasNumber ? styles.met : styles.unmet}>
                {hasNumber ? <Check size={13} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
                <span>At least one numeric digit (0-9)</span>
              </li>
            </ul>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="signup-currency" className={styles.label}>
              Base Currency
            </label>
            <Select
              id="signup-currency"
              value={currency}
              onChange={(val) => setCurrency(val)}
              options={CURRENCIES.map((c) => ({
                value: c.code,
                label: c.label,
              }))}
              disabled={isSubmitting}
              aria-label="Base Currency"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <footer className={styles.footer}>
          Already have an account? <Link to="/login">Sign In</Link>
        </footer>
      </div>
    </div>
  );
}
