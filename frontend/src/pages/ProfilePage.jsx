import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './ProfilePage.css';

// Client-side image compression for avatar photos
const compressAvatar = (file, maxDim = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
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

  const fileInputRef = useRef(null);

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
        updateUser(u);
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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveStatus({ success: '', error: 'Please select an image file (PNG, JPG, WEBP).' });
      return;
    }

    try {
      setSaveStatus({ success: '', error: '' });
      const compressedDataUrl = await compressAvatar(file, 400, 0.85);
      setPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Avatar compression error', err);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        photo_url: photoUrl || null,
        language_pref: languagePref,
      });

      const updatedUser = res.data;
      updateUser(updatedUser);

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
          {/* Direct Profile Photo Upload */}
          <div className="profile-avatar-section">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />

            <div
              className="profile-avatar-wrapper"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="profile-avatar-large" />
              ) : (
                <div className="profile-avatar-large--fallback">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="profile-avatar-overlay">📷</div>
            </div>

            <div className="profile-avatar-controls">
              <span className="profile-avatar-controls__title">Profile Avatar</span>
              <span className="profile-avatar-controls__hint">
                JPG, PNG, or WEBP from your computer
              </span>
              <div className="profile-avatar-btn-row">
                <Button
                  type="button"
                  variant="secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoUrl ? '🔄 Change Photo' : '📷 Upload Photo'}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="danger"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={handleRemovePhoto}
                  >
                    🗑️ Remove
                  </Button>
                )}
              </div>
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
            <Button variant="primary" type="submit" loading={loading}>
              Save Profile Changes
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
                loading={deleteLoading}
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
