import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Brand */}
        <NavLink to={isAuthenticated ? '/dashboard' : '/login'} className="navbar__brand">
          <span className="navbar__logo">🌍</span>
          <span className="navbar__name">GlobeTrotter</span>
        </NavLink>

        {/* Right-side links */}
        {isAuthenticated ? (
          <div className="navbar__links">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/trips"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              end
            >
              My Trips
            </NavLink>
            <NavLink
              to="/trips/new"
              className={({ isActive }) => `navbar__link navbar__link--cta ${isActive ? 'navbar__link--active' : ''}`}
            >
              + Plan Trip
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `navbar__link navbar__user-pill ${isActive ? 'navbar__link--active' : ''}`}
            >
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="navbar__avatar" />
              ) : (
                <span className="navbar__avatar navbar__avatar--fallback">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
              <span className="navbar__username">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </NavLink>
            <Button variant="secondary" onClick={handleLogout} className="navbar__logout-btn">
              Log Out
            </Button>
          </div>
        ) : (
          <div className="navbar__links">
            <NavLink to="/login" className="navbar__link">Log In</NavLink>
            <NavLink to="/signup" className="navbar__btn-signup">Sign Up</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
