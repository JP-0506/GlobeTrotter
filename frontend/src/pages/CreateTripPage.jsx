import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import './CreateTripPage.css';

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

export default function CreateTripPage() {
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || '';

  const [name, setName] = useState(initialCity ? `Trip to ${initialCity}` : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null); // base64 string

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Set default initial dates (today to today + 7 days)
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  // Handle direct file upload from device with auto-compression
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setError('');
      const compressedDataUrl = await compressImage(file, 1200, 0.8);
      setCoverPhoto(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image', err);
      // Fallback to basic file reader
      const reader = new FileReader();
      reader.onloadend = () => setCoverPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a trip name.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end travel dates.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim(),
        cover_photo_url: coverPhoto || undefined,
      };

      const res = await api.post('/trips', payload);
      const createdTrip = res.data;

      // Immediately navigate to Itinerary Builder for this trip
      navigate(`/trips/${createdTrip.trip_id}`);
    } catch (err) {
      setError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-trip-container">
      <div className="create-trip-card">
        <div className="create-trip-header">
          <h1 className="create-trip-header__title">Plan a New Journey ✈️</h1>
          <p className="create-trip-header__subtitle">
            Set your dates and trip name to start building your personalized itinerary
          </p>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-trip-form">
          {/* 1. Trip Name */}
          <Input
            label="Trip Name"
            id="trip-name"
            placeholder="e.g. Euro Summer 2026, Tokyo Discovery"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* 2. Start Date & 3. End Date */}
          <div className="form-row">
            <Input
              label="Start Date"
              id="trip-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              id="trip-end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          {/* 4. Trip Description */}
          <div className="textarea-group">
            <label htmlFor="trip-description" className="textarea-group__label">
              Trip Description / Notes
            </label>
            <textarea
              id="trip-description"
              className="textarea-group__input"
              placeholder="What are your goals or notes for this trip? (e.g. Visit museums, try local food, relaxing pace)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 5. Direct Cover Photo Upload (No Path/URL input) */}
          <div className="image-upload-wrapper">
            <label className="textarea-group__label">
              Cover Photo (Optional)
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            {!coverPhoto ? (
              <div
                className="image-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="image-dropzone__icon">📷</div>
                <span className="image-dropzone__title">Click to upload cover photo</span>
                <span className="image-dropzone__hint">Supports JPG, PNG, WEBP from your device</span>
              </div>
            ) : (
              <div
                className="cover-preview-card"
                style={{ backgroundImage: `url(${coverPhoto})` }}
              >
                <span className="cover-preview-card__badge">Cover Photo Attached</span>
                <div className="cover-preview-card__actions">
                  <button
                    type="button"
                    className="cover-preview-card__btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    🔄 Change
                  </button>
                  <button
                    type="button"
                    className="cover-preview-card__btn cover-preview-card__btn--danger"
                    onClick={handleRemoveImage}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Save Button & Cancel */}
          <div className="create-trip-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/trips')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Save & Build Itinerary →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
