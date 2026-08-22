import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './TripsListPage.css';

// Client-side image compression to optimize base64 size
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
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

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
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

export default function TripsListPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit Trip Modal state
  const [editingTrip, setEditingTrip] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', start_date: '', end_date: '', description: '', cover_photo_url: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Trip confirmation state
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const editFileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, [filterStatus]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      let url = '/trips';
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const res = await api.get(url);
      setTrips(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load trips.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (trip, e) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setEditFormData({
      name: trip.name || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      description: trip.description || '',
      cover_photo_url: trip.cover_photo_url || '',
    });
    setEditError('');
  };

  const handleEditImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file.');
      return;
    }

    try {
      setEditError('');
      const compressed = await compressImage(file, 1200, 0.8);
      setEditFormData((prev) => ({ ...prev, cover_photo_url: compressed }));
    } catch (err) {
      console.error('Failed to compress edit image', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData((prev) => ({ ...prev, cover_photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setEditError('Trip name is required.');
      return;
    }
    if (editFormData.end_date < editFormData.start_date) {
      setEditError('End date cannot be earlier than start date.');
      return;
    }

    try {
      setEditLoading(true);
      await api.patch(`/trips/${editingTrip.trip_id}`, editFormData);
      setEditingTrip(null);
      await fetchTrips();
    } catch (err) {
      setEditError(err.message || 'Failed to update trip.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!deletingTrip) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/trips/${deletingTrip.trip_id}`);
      setDeletingTrip(null);
      await fetchTrips();
    } catch (err) {
      alert(err.message || 'Failed to delete trip.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return trip.name?.toLowerCase().includes(q) || trip.description?.toLowerCase().includes(q);
  });

  return (
    <div className="trips-page">
      {/* Header */}
      <div className="trips-header">
        <div>
          <h1 className="trips-header__title">My Trips 🧳</h1>
          <p className="trips-header__subtitle">Manage, customize, and view all your travel itineraries</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/trips/new')}>
          + Plan New Trip
        </Button>
      </div>

      {/* Controls: Search & Filter Tabs */}
      <div className="trips-controls">
        <input
          type="text"
          className="trips-search-input"
          placeholder="🔍 Search trips by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="trips-filter-tabs">
          <button
            type="button"
            className={`trips-filter-tab ${filterStatus === 'all' ? 'trips-filter-tab--active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`trips-filter-tab ${filterStatus === 'upcoming' ? 'trips-filter-tab--active' : ''}`}
            onClick={() => setFilterStatus('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`trips-filter-tab ${filterStatus === 'past' ? 'trips-filter-tab--active' : ''}`}
            onClick={() => setFilterStatus('past')}
          >
            Past
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="page-placeholder">
          <LoadingSpinner size="md" />
          <p>Loading your trips...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          message={search ? `No trips found matching "${search}".` : "You haven't created any trips yet."}
        >
          <Button variant="primary" onClick={() => navigate('/trips/new')}>
            Create your first trip
          </Button>
        </EmptyState>
      ) : (
        <div className="my-trips-grid">
          {filteredTrips.map((trip) => {
            const coverImg =
              trip.cover_photo_url ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80';
            const destinationCount = trip.stops_count || 0;

            return (
              <div key={trip.trip_id} className="my-trip-card">
                <div
                  className="my-trip-card__cover"
                  style={{ backgroundImage: `url(${coverImg})` }}
                >
                  <span className="my-trip-card__status">{trip.status || 'Planned'}</span>
                </div>

                <div className="my-trip-card__body">
                  {/* 1. Name */}
                  <h3 className="my-trip-card__title">{trip.name}</h3>

                  {/* 2. Date Range */}
                  <div className="my-trip-card__dates">
                    <span>📅</span>
                    <span>{trip.start_date} → {trip.end_date}</span>
                  </div>

                  {/* 3. Destination Count */}
                  <div className="my-trip-card__info-row">
                    <span className="my-trip-card__destinations">
                      📍 {destinationCount} {destinationCount === 1 ? 'Destination' : 'Destinations'}
                    </span>
                    {trip.duration_days && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        ⏱️ {trip.duration_days} days
                      </span>
                    )}
                  </div>

                  {/* 4. Edit / View / Delete Actions */}
                  <div className="my-trip-card__actions">
                    <Button
                      variant="primary"
                      className="my-trip-card__btn-view"
                      onClick={() => navigate(`/trips/${trip.trip_id}`)}
                    >
                      View Itinerary
                    </Button>
                    <Button
                      variant="secondary"
                      className="my-trip-card__btn-edit"
                      onClick={(e) => handleOpenEdit(trip, e)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="my-trip-card__btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTrip(trip);
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="modal-overlay" onClick={() => setEditingTrip(null)}>
          <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Trip Details</h2>
              <p className="modal-subtitle">Update name, dates, or notes for {editingTrip.name}</p>
            </div>

            {editError && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="auth-form">
              <Input
                label="Trip Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />

              <div className="form-row">
                <Input
                  label="Start Date"
                  type="date"
                  value={editFormData.start_date}
                  onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={editFormData.end_date}
                  min={editFormData.start_date}
                  onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                  required
                />
              </div>

              {/* Direct Image File Upload in Edit Modal */}
              <div className="image-upload-wrapper">
                <label className="textarea-group__label">Cover Photo</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleEditImageFileChange}
                />

                {!editFormData.cover_photo_url ? (
                  <div
                    className="image-dropzone"
                    style={{ padding: '1.25rem 1rem' }}
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <div className="image-dropzone__icon" style={{ fontSize: '1.75rem' }}>📷</div>
                    <span className="image-dropzone__title" style={{ fontSize: '0.875rem' }}>Upload new cover image</span>
                  </div>
                ) : (
                  <div
                    className="cover-preview-card"
                    style={{ height: '140px', backgroundImage: `url(${editFormData.cover_photo_url})` }}
                  >
                    <span className="cover-preview-card__badge">Current Cover</span>
                    <div className="cover-preview-card__actions">
                      <button
                        type="button"
                        className="cover-preview-card__btn"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        🔄 Change
                      </button>
                      <button
                        type="button"
                        className="cover-preview-card__btn cover-preview-card__btn--danger"
                        onClick={() => setEditFormData({ ...editFormData, cover_photo_url: '' })}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="textarea-group">
                <label className="textarea-group__label">Description</label>
                <textarea
                  className="textarea-group__input"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingTrip(null)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrip && (
        <div className="modal-overlay" onClick={() => setDeletingTrip(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>Delete Trip</h2>
              <p className="modal-subtitle">
                Are you sure you want to delete <strong>"{deletingTrip.name}"</strong>? All stops, activities, and budget items will be permanently removed.
              </p>
            </div>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setDeletingTrip(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteTrip}
                loading={deleteLoading}
              >
                Yes, Delete Trip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
