import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides auth state.
 *
 * Exposes: { user, token, login(), logout(), updateUser(), isAuthenticated }
 *
 * - login(token, user) stores creds in localStorage and state
 * - updateUser(user) updates user state & localStorage
 * - logout() clears everything and navigates to /login
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gt_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gt_user');
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!token;

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) return;
    localStorage.setItem('gt_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('gt_token', newToken);
    localStorage.setItem('gt_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    setToken(null);
    setUser(null);
  }, []);

  // Fetch fresh user profile on initial mount/refresh if token exists
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data) {
            updateUser(res.data);
          }
        })
        .catch((err) => {
          console.warn('Session refresh check', err?.message);
        });
    }
  }, [token, updateUser]);

  /* Sync across tabs */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'gt_token') {
        setToken(e.newValue);
        if (!e.newValue) setUser(null);
      }
      if (e.key === 'gt_user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook — use this in any component to access auth state.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
