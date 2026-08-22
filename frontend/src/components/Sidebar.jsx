import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('gt_dark_mode') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('gt_dark_mode', darkMode);
  }, [darkMode]);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Vertical Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar--open' : ''}`}>
        {/* Top: Logo & Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand__logo">🌍</div>
          <span className="sidebar-brand__name">GlobeTrotter</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-menu__link ${isActive ? 'sidebar-menu__link--active' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            {/* Dashboard Icon */}
            <svg
              className="sidebar-menu__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `sidebar-menu__link ${isActive ? 'sidebar-menu__link--active' : ''}`
            }
            end
            onClick={() => setMobileOpen(false)}
          >
            {/* Luggage / My Trips Icon */}
            <svg
              className="sidebar-menu__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="12" y1="12" x2="12" y2="12.01" />
              <line x1="8" y1="12" x2="8" y2="12.01" />
              <line x1="16" y1="12" x2="16" y2="12.01" />
            </svg>
            <span>My Trips</span>
          </NavLink>

          <NavLink
            to="/trips/new"
            className={({ isActive }) =>
              `sidebar-menu__link ${isActive ? 'sidebar-menu__link--active' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            {/* Plan New Trip Icon */}
            <svg
              className="sidebar-menu__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Plan New Trip</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar-menu__link ${isActive ? 'sidebar-menu__link--active' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            {/* Profile User Icon */}
            <svg
              className="sidebar-menu__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className="sidebar-dark-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            <svg
              className="sidebar-dark-toggle__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Divider */}
          <div className="sidebar-divider" />

          {/* User Profile Footer Row */}
          <div className="sidebar-user-footer">
            <div className="sidebar-user-footer__left" onClick={() => navigate('/profile')}>
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="sidebar-avatar-img" />
              ) : (
                <div className="sidebar-avatar-initials">
                  {initials}
                </div>
              )}

              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {user?.name?.toUpperCase() || 'USER'}
                </span>
                <span className="sidebar-user-email">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            </div>

            {/* Logout Exit Icon */}
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Log Out"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
