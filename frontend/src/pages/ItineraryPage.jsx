import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './ItineraryPage.css';

export default function ItineraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mode: 'builder' (interactive editor) | 'view' (clean presentation list)
  const [viewMode, setViewMode] = useState('builder');

  // Add Stop Modal State
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [stopArrival, setStopArrival] = useState('');
  const [stopDeparture, setStopDeparture] = useState('');
  const [stopNotes, setStopNotes] = useState('');
  const [stopLoading, setStopLoading] = useState(false);
  const [stopError, setStopError] = useState('');

  // Edit Stop Modal State
  const [editingStop, setEditingStop] = useState(null);
  const [editStopArrival, setEditStopArrival] = useState('');
  const [editStopDeparture, setEditStopDeparture] = useState('');
  const [editStopNotes, setEditStopNotes] = useState('');
  const [editStopLoading, setEditStopLoading] = useState(false);
  const [editStopError, setEditStopError] = useState('');

  // Add Activity Modal State
  const [activeDayModal, setActiveDayModal] = useState(null); // { dateStr, stop, dayNumber }
  const [cityActivities, setCityActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTime, setActivityTime] = useState('10:00');
  const [costOverride, setCostOverride] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    fetchTripData();
    fetchCitiesList();
  }, [id]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load trip itinerary.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCitiesList = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data || []);
    } catch (err) {
      console.error('Failed to load cities catalog', err);
    }
  };

  // Open Add Stop Modal with smart default dates
  const handleOpenAddStop = () => {
    if (!trip) return;
    const existingStops = trip.stops || [];
    let defaultArrival = trip.start_date;
    let defaultDeparture = trip.end_date;

    if (existingStops.length > 0) {
      const lastStop = existingStops[existingStops.length - 1];
      defaultArrival = lastStop.departure_date || trip.start_date;
      defaultDeparture = trip.end_date;
    }

    setStopArrival(defaultArrival);
    setStopDeparture(defaultDeparture);
    setSelectedCityId(cities[0]?.city_id || '');
    setStopNotes('');
    setStopError('');
    setShowAddStopModal(true);
  };

  const handleSaveStop = async (e) => {
    e.preventDefault();
    setStopError('');

    if (!selectedCityId) {
      setStopError('Please select a destination city.');
      return;
    }
    if (!stopArrival || !stopDeparture) {
      setStopError('Please provide arrival and departure dates.');
      return;
    }
    if (stopDeparture < stopArrival) {
      setStopError('Departure date cannot be earlier than arrival date.');
      return;
    }
    if (stopArrival < trip.start_date || stopDeparture > trip.end_date) {
      setStopError(`Stop dates must fall within trip bounds (${trip.start_date} to ${trip.end_date}).`);
      return;
    }

    try {
      setStopLoading(true);
      const nextSequence = (trip.stops?.length || 0) + 1;
      await api.post('/stops', {
        trip: trip.trip_id,
        city: Number(selectedCityId),
        arrival_date: stopArrival,
        departure_date: stopDeparture,
        sequence_order: nextSequence,
        notes: stopNotes.trim(),
      });

      setShowAddStopModal(false);
      await fetchTripData();
    } catch (err) {
      setStopError(err.message || 'Failed to add destination stop.');
    } finally {
      setStopLoading(false);
    }
  };

  const handleOpenEditStop = (stop, e) => {
    e.stopPropagation();
    setEditingStop(stop);
    setEditStopArrival(stop.arrival_date);
    setEditStopDeparture(stop.departure_date);
    setEditStopNotes(stop.notes || '');
    setEditStopError('');
  };

  const handleSaveEditStop = async (e) => {
    e.preventDefault();
    setEditStopError('');

    if (editStopDeparture < editStopArrival) {
      setEditStopError('Departure date cannot be earlier than arrival date.');
      return;
    }
    if (editStopArrival < trip.start_date || editStopDeparture > trip.end_date) {
      setEditStopError(`Dates must fall within trip bounds (${trip.start_date} to ${trip.end_date}).`);
      return;
    }

    try {
      setEditStopLoading(true);
      await api.patch(`/stops/${editingStop.stop_id}`, {
        arrival_date: editStopArrival,
        departure_date: editStopDeparture,
        notes: editStopNotes.trim(),
      });

      setEditingStop(null);
      await fetchTripData();
    } catch (err) {
      setEditStopError(err.message || 'Failed to update stop.');
    } finally {
      setEditStopLoading(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Are you sure you want to remove this stop and all its scheduled activities?')) return;
    try {
      await api.delete(`/stops/${stopId}`);
      await fetchTripData();
    } catch (err) {
      alert(err.message || 'Failed to delete stop.');
    }
  };

  const handleMoveStop = async (index, direction) => {
    const stops = [...(trip.stops || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const currentStop = stops[index];
    const targetStop = stops[targetIndex];

    const currentSeq = currentStop.sequence_order;
    const targetSeq = targetStop.sequence_order;

    try {
      await api.post('/stops/reorder', {
        stops: [
          { stop_id: currentStop.stop_id, sequence_order: targetSeq },
          { stop_id: targetStop.stop_id, sequence_order: currentSeq },
        ],
      });
      await fetchTripData();
    } catch (err) {
      alert(err.message || 'Failed to reorder stops.');
    }
  };

  // Open Activity Modal for a specific Day
  const handleOpenAddActivity = async (dayInfo) => {
    setActiveDayModal(dayInfo);
    setSelectedActivityId('');
    setActivitySearch('');
    setActivityTime('10:00');
    setCostOverride('');
    setActivityError('');
    setCityActivities([]);

    if (dayInfo.stop?.city?.city_id) {
      try {
        const res = await api.get(`/cities/${dayInfo.stop.city.city_id}/activities`);
        setCityActivities(res.data || []);
        if (res.data?.length > 0) {
          setSelectedActivityId(res.data[0].activity_id);
          setCostOverride(res.data[0].cost || '0.00');
        }
      } catch (err) {
        console.error('Failed to load city activities', err);
      }
    }
  };

  const handleSelectActivity = (act) => {
    setSelectedActivityId(act.activity_id);
    setCostOverride(act.cost || '0.00');
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!selectedActivityId) {
      setActivityError('Please select an activity from the catalog.');
      return;
    }
    if (!activeDayModal?.stop) {
      setActivityError('No city stop associated with this day.');
      return;
    }

    try {
      setActivityLoading(true);
      await api.post('/trip-activities', {
        stop: activeDayModal.stop.stop_id,
        activity: Number(selectedActivityId),
        scheduled_date: activeDayModal.dateStr,
        start_time: activityTime ? `${activityTime}:00` : null,
        cost_override: costOverride ? Number(costOverride) : undefined,
        sequence_order: 1,
      });

      setActiveDayModal(null);
      await fetchTripData();
    } catch (err) {
      setActivityError(err.message || 'Failed to assign activity.');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Remove this activity from your schedule?')) return;
    try {
      await api.delete(`/trip-activities/${activityId}`);
      await fetchTripData();
    } catch (err) {
      alert(err.message || 'Failed to remove activity.');
    }
  };

  // Generate day-by-day dates breakdown
  const daysList = useMemo(() => {
    if (!trip || !trip.start_date || !trip.end_date) return [];
    const days = [];
    const curr = new Date(trip.start_date);
    const end = new Date(trip.end_date);

    let dayNumber = 1;
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];

      // Find matching stop for this date
      const matchedStop = (trip.stops || []).find((s) => {
        return dateStr >= s.arrival_date && dateStr <= s.departure_date;
      });

      // Find activities scheduled on this date
      const scheduledActs = [];
      (trip.stops || []).forEach((s) => {
        (s.activities || []).forEach((act) => {
          if (act.scheduled_date === dateStr) {
            scheduledActs.push({ ...act, stopCity: s.city?.name });
          }
        });
      });

      // Sort activities by start_time
      scheduledActs.sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

      days.push({
        dayNumber,
        dateStr,
        stop: matchedStop,
        activities: scheduledActs,
      });

      curr.setDate(curr.getDate() + 1);
      dayNumber++;
    }

    return days;
  }, [trip]);

  // Filter activities in modal by search
  const filteredCityActivities = cityActivities.filter((act) => {
    if (!activitySearch.trim()) return true;
    const q = activitySearch.toLowerCase();
    return act.name?.toLowerCase().includes(q) || act.category?.toLowerCase().includes(q);
  });

  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'sightseeing': return '📸';
      case 'food': return '🍕';
      case 'adventure': return '🧗';
      case 'culture': return '🏛️';
      case 'nightlife': return '🍸';
      case 'shopping': return '🛍️';
      case 'relaxation': return '💆';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="page-placeholder">
        <LoadingSpinner size="lg" />
        <p>Loading itinerary builder...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="page-placeholder">
        <h2>Trip Not Found</h2>
        <p>{error || 'Unable to load trip details.'}</p>
        <Button variant="primary" onClick={() => navigate('/trips')}>Back to My Trips</Button>
      </div>
    );
  }

  const coverBg =
    trip.cover_photo_url ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80';
  const stops = trip.stops || [];

  return (
    <div className="itinerary-page">
      {/* 1. Trip Hero Overview Banner */}
      <div className="itinerary-banner" style={{ backgroundImage: `url(${coverBg})` }}>
        <div className="itinerary-banner__overlay">
          <div className="itinerary-banner__top">
            <button className="itinerary-banner__back-btn" onClick={() => navigate('/trips')}>
              ← Back to Trips
            </button>

            {/* View Mode Switcher (Builder vs Clean Itinerary View) */}
            <div className="itinerary-view-toggle">
              <button
                type="button"
                className={`itinerary-view-toggle__btn ${viewMode === 'builder' ? 'itinerary-view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('builder')}
              >
                🛠️ Builder Mode
              </button>
              <button
                type="button"
                className={`itinerary-view-toggle__btn ${viewMode === 'view' ? 'itinerary-view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('view')}
              >
                👁️ Itinerary View
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to={`/trips/${trip.trip_id}/budget`} className="itinerary-banner__back-btn">
                💰 Budget Breakdown
              </Link>
            </div>
          </div>

          <div>
            <h1 className="itinerary-banner__title">{trip.name}</h1>
            <div className="itinerary-banner__meta">
              <span>📅 {trip.start_date} → {trip.end_date}</span>
              <span>⏱️ {trip.duration_days} Days</span>
              <span className="itinerary-banner__badge">
                📍 {stops.length} {stops.length === 1 ? 'City Stop' : 'City Stops'}
              </span>
              {trip.description && (
                <span style={{ fontStyle: 'italic', opacity: 0.9 }}>• {trip.description}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODE 1: BUILDER MODE
          ==================================================================== */}
      {viewMode === 'builder' ? (
        <>
          {/* 2. Multi-City Stops Sequence & Reordering Bar */}
          <section className="stops-section">
            <div className="stops-section__header">
              <div>
                <h2 className="stops-section__title">🗺️ Travel Route & Stops</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Add cities, adjust sequence, or edit stay dates
                </p>
              </div>
              <Button variant="primary" onClick={handleOpenAddStop}>
                + Add City Stop
              </Button>
            </div>

            {stops.length === 0 ? (
              <EmptyState message="No destination stops added to this trip yet.">
                <Button variant="primary" onClick={handleOpenAddStop}>
                  Add First City Stop
                </Button>
              </EmptyState>
            ) : (
              <div className="stops-timeline">
                {stops.map((stop, idx) => (
                  <div key={stop.stop_id} className="stop-pill">
                    <div className="stop-pill__top">
                      <span className="stop-pill__order">Stop #{idx + 1}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        📍 {stop.city?.country}
                      </span>
                    </div>

                    <div className="stop-pill__city">{stop.city?.name}</div>

                    <div className="stop-pill__dates">
                      <span>📅</span>
                      <span>{stop.arrival_date} → {stop.departure_date}</span>
                    </div>

                    {stop.notes && (
                      <div className="stop-pill__notes">
                        "{stop.notes}"
                      </div>
                    )}

                    <div className="stop-pill__actions">
                      <button
                        type="button"
                        className="stop-pill__btn"
                        disabled={idx === 0}
                        onClick={() => handleMoveStop(idx, -1)}
                        title="Move Left"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        className="stop-pill__btn"
                        disabled={idx === stops.length - 1}
                        onClick={() => handleMoveStop(idx, 1)}
                        title="Move Right"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        className="stop-pill__btn"
                        onClick={(e) => handleOpenEditStop(stop, e)}
                        title="Edit Dates / Notes"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="stop-pill__btn"
                        style={{ color: 'var(--color-danger)', marginLeft: 'auto' }}
                        onClick={() => handleDeleteStop(stop.stop_id)}
                        title="Delete Stop"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Day-by-Day Structured Activity Builder */}
          <section className="days-schedule">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  🗓️ Day-by-Day Activity Schedule
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Assign activities, tours, and sightseeing per day in each city
                </p>
              </div>
            </div>

            {daysList.map((day) => (
              <div key={day.dateStr} className="day-card">
                <div className="day-card__header">
                  <div className="day-card__title-row">
                    <span className="day-card__day-badge">Day {day.dayNumber}</span>
                    <span className="day-card__date">{day.dateStr}</span>
                    {day.stop ? (
                      <span className="day-card__city-tag">
                        📍 {day.stop.city?.name}, {day.stop.city?.country}
                      </span>
                    ) : (
                      <span className="day-card__city-tag" style={{ color: 'var(--color-danger)', borderColor: '#f8b4b4' }}>
                        ⚠️ No Stop Assigned
                      </span>
                    )}
                  </div>

                  {day.stop && (
                    <Button
                      variant="secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleOpenAddActivity(day)}
                    >
                      + Add Activity
                    </Button>
                  )}
                </div>

                <div className="day-card__content">
                  {day.activities.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                      No activities scheduled for this day.{' '}
                      {day.stop ? 'Click "+ Add Activity" to add sightseeing, dining, or tours.' : 'Assign a city stop first.'}
                    </p>
                  ) : (
                    <div className="activities-list">
                      {day.activities.map((act) => {
                        const actDetails = act.activity || {};
                        const effectivePrice = act.cost_override !== null && act.cost_override !== undefined
                          ? act.cost_override
                          : actDetails.cost || 0;

                        return (
                          <div key={act.trip_activity_id} className="activity-item">
                            <div className="activity-item__left">
                              <span className="activity-item__time">
                                ⏰ {act.start_time ? act.start_time.slice(0, 5) : 'Flexible'}
                              </span>
                              <div className="activity-item__info">
                                <span className="activity-item__name">{actDetails.name}</span>
                                <span className="activity-item__category">
                                  {getCategoryIcon(actDetails.category)} {actDetails.category || 'General'}
                                  {actDetails.duration_minutes ? ` • ⏱️ ${actDetails.duration_minutes} mins` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="activity-item__right">
                              <span className="activity-item__cost">
                                ${Number(effectivePrice).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                className="activity-item__delete"
                                onClick={() => handleDeleteActivity(act.trip_activity_id)}
                                title="Remove activity"
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
              </div>
            ))}
          </section>
        </>
      ) : (
        /* ====================================================================
            MODE 2: CLEAN ITINERARY VIEW (PDF §6 - Structured Simple List)
            ==================================================================== */
        <section className="itinerary-view-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                📋 Travel Itinerary Overview
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>
                Complete structured day-wise travel plan
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              style={{ fontSize: '0.85rem' }}
            >
              🖨️ Print / Save PDF
            </Button>
          </div>

          {daysList.map((day) => (
            <div key={day.dateStr} className="itinerary-view-day">
              <div className="itinerary-view-day__header">
                <span className="day-card__day-badge">Day {day.dayNumber}</span>
                <span>{day.dateStr}</span>
                {day.stop && (
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    • {day.stop.city?.name}, {day.stop.city?.country}
                  </span>
                )}
              </div>

              {day.activities.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  Free day / Self-exploration
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {day.activities.map((act) => {
                    const actDetails = act.activity || {};
                    const price = act.cost_override ?? actDetails.cost ?? 0;
                    return (
                      <div
                        key={act.trip_activity_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          padding: '0.65rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.925rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                            {act.start_time ? act.start_time.slice(0, 5) : 'Flexible'}
                          </span>
                          <span style={{ fontWeight: 600 }}>{actDetails.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            ({actDetails.category || 'Sightseeing'})
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                          ${Number(price).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Modal: Add City Stop */}
      {showAddStopModal && (
        <div className="modal-overlay" onClick={() => setShowAddStopModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Destination Stop 📍</h2>
              <p className="modal-subtitle">Add a city and arrival/departure dates to your trip</p>
            </div>

            {stopError && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{stopError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStop} className="auth-form">
              <div className="select-group">
                <label className="select-group__label">Destination City *</label>
                <select
                  className="select-group__input"
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  required
                >
                  <option value="">Select a city...</option>
                  {cities.map((c) => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.name}, {c.country} ({c.region || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <Input
                  label="Arrival Date"
                  type="date"
                  value={stopArrival}
                  min={trip.start_date}
                  max={trip.end_date}
                  onChange={(e) => setStopArrival(e.target.value)}
                  required
                />
                <Input
                  label="Departure Date"
                  type="date"
                  value={stopDeparture}
                  min={stopArrival || trip.start_date}
                  max={trip.end_date}
                  onChange={(e) => setStopDeparture(e.target.value)}
                  required
                />
              </div>

              <div className="textarea-group">
                <label className="textarea-group__label">Stop Notes (Optional)</label>
                <textarea
                  className="textarea-group__input"
                  rows={2}
                  placeholder="e.g. Hotel reservation, central neighborhood, airport transfer"
                  value={stopNotes}
                  onChange={(e) => setStopNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddStopModal(false)}
                  disabled={stopLoading}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={stopLoading}>
                  {stopLoading ? <LoadingSpinner size="sm" /> : 'Add Stop'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit City Stop */}
      {editingStop && (
        <div className="modal-overlay" onClick={() => setEditingStop(null)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Stop: {editingStop.city?.name} ✏️</h2>
              <p className="modal-subtitle">Update dates or travel notes for this stop</p>
            </div>

            {editStopError && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{editStopError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditStop} className="auth-form">
              <div className="form-row">
                <Input
                  label="Arrival Date"
                  type="date"
                  value={editStopArrival}
                  min={trip.start_date}
                  max={trip.end_date}
                  onChange={(e) => setEditStopArrival(e.target.value)}
                  required
                />
                <Input
                  label="Departure Date"
                  type="date"
                  value={editStopDeparture}
                  min={editStopArrival || trip.start_date}
                  max={trip.end_date}
                  onChange={(e) => setEditStopDeparture(e.target.value)}
                  required
                />
              </div>

              <div className="textarea-group">
                <label className="textarea-group__label">Notes</label>
                <textarea
                  className="textarea-group__input"
                  rows={2}
                  value={editStopNotes}
                  onChange={(e) => setEditStopNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingStop(null)}
                  disabled={editStopLoading}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={editStopLoading}>
                  {editStopLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Activity to Day */}
      {activeDayModal && (
        <div className="modal-overlay" onClick={() => setActiveDayModal(null)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Schedule Activity 🎟️</h2>
              <p className="modal-subtitle">
                Day {activeDayModal.dayNumber} ({activeDayModal.dateStr}) in {activeDayModal.stop?.city?.name}
              </p>
            </div>

            {activityError && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{activityError}</span>
              </div>
            )}

            <form onSubmit={handleSaveActivity} className="auth-form">
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Activity in {activeDayModal.stop?.city?.name} *
                </label>

                <input
                  type="text"
                  className="activity-search-input"
                  placeholder="🔍 Filter activities by name or category..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />

                {filteredCityActivities.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
                    No activities found matching "{activitySearch}".
                  </p>
                ) : (
                  <div className="activity-picker-grid">
                    {filteredCityActivities.map((act) => (
                      <div
                        key={act.activity_id}
                        className={`activity-picker-card ${selectedActivityId === act.activity_id ? 'activity-picker-card--selected' : ''}`}
                        onClick={() => handleSelectActivity(act)}
                      >
                        <span className="activity-picker-card__title">{act.name}</span>
                        <div className="activity-picker-card__meta">
                          <span>{getCategoryIcon(act.category)} {act.category}</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                            ${Number(act.cost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <Input
                  label="Start Time"
                  type="time"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                />
                <Input
                  label="Cost Override ($)"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank for catalog price"
                  value={costOverride}
                  onChange={(e) => setCostOverride(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveDayModal(null)}
                  disabled={activityLoading}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={activityLoading}>
                  {activityLoading ? <LoadingSpinner size="sm" /> : 'Assign to Day'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
