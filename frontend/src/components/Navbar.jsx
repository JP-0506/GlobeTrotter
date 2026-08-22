import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Brand */}
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__logo">🌍</span>
          <span className="navbar__name">GlobeTrotter</span>
        </NavLink>

        {/* Right-side links (only when logged in) */}
        {isAuthenticated && (
          <div className="navbar__links">
            <NavLink to="/dashboard" className="navbar__link">Dashboard</NavLink>
            <NavLink to="/trips" className="navbar__link">My Trips</NavLink>
            <NavLink to="/profile" className="navbar__link">Profile</NavLink>
            <Button variant="secondary" onClick={handleLogout} className="navbar__logout">
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
