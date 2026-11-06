import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Wallet,
  LogOut,
  Bell,
  User,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { notificationService } from '../../../services/notificationService';
import styles from './Header.module.scss';

export function Header({ title = 'Dashboard' }) {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

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

  const getFirstName = (name) => {
    if (!name) return 'there';
    return name.trim().split(' ')[0];
  };

  // Fetch notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(20);
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Non-critical, ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerInner}>
        <div className={styles.leftSection}>
          <div className={styles.mobileBrand}>
            <div className={styles.mobileLogo} aria-hidden="true">
              <Wallet size={18} />
            </div>
          </div>

          <div className={styles.greetingGroup}>
            {user ? (
              <span className={styles.greetingText}>Welcome, {getFirstName(user.name)}</span>
            ) : null}
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.dateFilter} title="Active billing cycle">
            <Calendar size={14} color="#087F5B" aria-hidden="true" />
            <span>{currentMonthYear}</span>
          </div>

          <div className={styles.userControls}>
            {/* Notification Bell */}
            <div className={styles.bellWrapper} ref={notifRef}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={showNotifications}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className={styles.bellBadge}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={styles.dropdownPopover} role="dialog" aria-label="Notifications list">
                  <div className={styles.popoverHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className={styles.markAllBtn}
                        onClick={handleMarkAllRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className={styles.popoverList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotifs}>No notifications yet.</div>
                    ) : (
                      notifications.map((n) => {
                        const notifId = n.id || n._id;
                        return (
                          <div
                            key={notifId}
                            className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`}
                            onClick={() => handleMarkAsRead(notifId, n.read)}
                          >
                            <span className={styles.notifTitle}>{n.title}</span>
                            <span className={styles.notifMsg}>{n.message}</span>
                            <span className={styles.notifTime}>
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            <div className={styles.bellWrapper} ref={userMenuRef}>
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div
                  className={styles.avatar}
                  title={user ? `${user.name} (${user.email})` : 'User Profile'}
                >
                  {getInitials(user?.name)}
                </div>
              </button>

              {showUserMenu && (
                <div className={styles.userMenuPopover} role="menu">
                  <div className={styles.userInfoHeader}>
                    <div className={styles.userName}>{user?.name}</div>
                    <div className={styles.userEmail}>{user?.email}</div>
                  </div>

                  <Link
                    to="/profile"
                    className={styles.menuItem}
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <User size={15} /> Profile & Settings
                  </Link>

                  <Link
                    to="/analytics"
                    className={styles.menuItem}
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <BarChart3 size={15} /> Financial Analytics
                  </Link>

                  <Link
                    to="/reports"
                    className={styles.menuItem}
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <FileSpreadsheet size={15} /> Reports & Exports
                  </Link>

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.danger}`}
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    role="menuitem"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
