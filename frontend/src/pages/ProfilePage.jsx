import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [languagePref, setLanguagePref] = useState('en');

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: '', error: '' });

  // Saved Destinations list state
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Delete Account confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSavedDestinations();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data;
      if (u) {
        setName(u.name || '');
        setEmail(u.email || '');
        setPhotoUrl(u.photo_url || '');
        setLanguagePref(u.language_pref || 'en');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchSavedDestinations = async () => {
    try {
      setLoadingDestinations(true);
      const res = await api.get('/saved-destinations');
      setSavedDestinations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch saved destinations', err);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus({ success: '', error: '' });

    if (!name.trim()) {
      setSaveStatus({ success: '', error: 'Name is required.' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.put('/auth/me', {
        name: name.trim(),
        email: email.trim(),
        photo_url: photoUrl.trim() || null,
        language_pref: languagePref,
      });

      const updatedUser = res.data;
      const currentToken = localStorage.getItem('gt_token');
      login(currentToken, updatedUser);

      setSaveStatus({ success: 'Profile updated successfully!', error: '' });
    } catch (err) {
      setSaveStatus({ success: '', error: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDestination = async (destId, e) => {
    e.preventDefault();
    try {
      await api.delete(`/saved-destinations/${destId}`);
      setSavedDestinations((prev) => prev.filter((d) => d.id !== destId && d.saved_destination_id !== destId));
    } catch (err) {
      alert(err.message || 'Failed to remove saved destination.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      // In django, user can be deactivated or deleted
      logout();
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="profile-container">
      {/* 1. User Profile & Preferences Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <h1 className="profile-card__title">User Profile & Settings ⚙️</h1>
          <p className="profile-card__subtitle">Update your personal information and application preferences</p>
        </div>

        {saveStatus.error && (
          <div className="auth-error-banner" style={{ marginBottom: '1.25rem' }}>
            <span>⚠️</span>
            <span>{saveStatus.error}</span>
          </div>
        )}

        {saveStatus.success && (
          <div className="auth-success-banner" style={{ marginBottom: '1.25rem' }}>
            <span>✅ {saveStatus.success}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="auth-form">
          <div className="profile-avatar-row">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-large--fallback">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <Input
                label="Photo URL"
                id="profile-photo"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            {/* Editable Name */}
            <Input
              label="Full Name"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Editable Email */}
            <Input
              label="Email Address"
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 2. Language Preference */}
          <div className="select-group">
            <label htmlFor="language-pref" className="select-group__label">
              Language Preference 🌐
            </label>
            <select
              id="language-pref"
              className="select-group__input"
              value={languagePref}
              onChange={(e) => setLanguagePref(e.target.value)}
            >
              <option value="en">English (US / UK)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Saved Destinations (Wishlist) */}
      <div className="profile-card">
        <div className="profile-card__header">
          <h2 className="profile-card__title">⭐ Saved Destinations List</h2>
          <p className="profile-card__subtitle">Your favorite cities saved for future trip inspirations</p>
        </div>

        {loadingDestinations ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner size="sm" />
          </div>
        ) : savedDestinations.length === 0 ? (
          <EmptyState message="No destinations saved to your wishlist yet. Discover cities on the Dashboard or Search to add them here." />
        ) : (
          <div className="saved-destinations-grid">
            {savedDestinations.map((item) => {
              const city = item.city || item;
              const imgUrl =
                city.image_url ||
                'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80';
              const id = item.saved_destination_id || item.id;
              return (
                <div key={id || city.city_id} className="saved-destination-item">
                  <div
                    className="saved-destination-item__img"
                    style={{ backgroundImage: `url(${imgUrl})` }}
                  />
                  <div className="saved-destination-item__body">
                    <div>
                      <div className="saved-destination-item__name">{city.name}</div>
                      <div className="saved-destination-item__country">{city.country}</div>
                    </div>
                    <button
                      type="button"
                      className="saved-destination-item__remove"
                      onClick={(e) => handleRemoveDestination(id, e)}
                      title="Remove from saved"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Delete Account (Danger Zone) */}
      <div className="profile-card danger-zone">
        <div className="profile-card__header">
          <h2 className="profile-card__title" style={{ color: 'var(--color-danger)' }}>
            ⚠️ Danger Zone
          </h2>
          <p className="profile-card__subtitle">
            Permanently remove your account and all associated itineraries, stops, and saved preferences.
          </p>
        </div>

        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>
                Confirm Account Deletion
              </h2>
              <p className="modal-subtitle">
                This action is irreversible. All your trips, multi-city itineraries, and personal data will be deleted.
              </p>
            </div>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? <LoadingSpinner size="sm" /> : 'Yes, Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
