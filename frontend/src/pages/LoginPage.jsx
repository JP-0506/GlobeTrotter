import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ loading: false, success: '', error: '' });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim(), password });
      if (res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError('Login failed: Invalid server response.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ loading: false, success: '', error: 'Please enter your registered email address.' });
      return;
    }
    setForgotStatus({ loading: true, success: '', error: '' });
    
    // Simulate password reset feedback
    setTimeout(() => {
      setForgotStatus({
        loading: false,
        success: 'If an account exists for this email, password reset instructions have been sent.',
        error: ''
      });
    }, 800);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-header__icon">🌍</span>
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in to manage your travel itineraries</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <Input
            label="Email Address"
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="auth-options">
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setForgotEmail(email);
                setForgotStatus({ loading: false, success: '', error: '' });
                setShowForgotModal(true);
              }}
            >
              Forgot Password?
            </button>
          </div>

          <Button variant="primary" type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Log In'}
          </Button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <p className="modal-subtitle">
                Enter your email address to receive password reset instructions.
              </p>
            </div>

            {forgotStatus.error && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{forgotStatus.error}</span>
              </div>
            )}

            {forgotStatus.success && (
              <div className="auth-success-banner" style={{ marginBottom: '1rem' }}>
                <span>✅ {forgotStatus.success}</span>
              </div>
            )}

            {!forgotStatus.success ? (
              <form onSubmit={handleForgotPassword}>
                <Input
                  label="Email Address"
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="modal-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotStatus.loading}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={forgotStatus.loading}>
                    {forgotStatus.loading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="modal-actions">
                <Button variant="primary" onClick={() => setShowForgotModal(false)}>
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
