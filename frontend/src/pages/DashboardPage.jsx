import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  const formatCostIndex = (index) => {
    if (!index) return '$$';
    const num = Number(index);
    if (num < 50) return '$ Budget';
    if (num < 80) return '$$ Moderate';
    return '$$$ Luxury';
  };

  if (loading) {
    return (
      <div className="page-placeholder">
        <LoadingSpinner size="lg" />
        <p>Loading your travel dashboard...</p>
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Traveler';
  const recentTrips = data?.recent_trips || [];
  const recommendedDestinations = data?.recommended_destinations || [];
  const stats = data?.stats || {};

  return (
    <div className="dashboard">
      {/* 1. Personalized Welcome Hero + 3. Plan New Trip Button */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h1 className="dashboard-hero__title">Welcome back, {firstName}! 🌍</h1>
          <p className="dashboard-hero__subtitle">
            Ready to design your next journey? Create multi-city itineraries, discover top activities,
            and stay within budget effortlessly.
          </p>
          <Button
            variant="primary"
            className="dashboard-hero__cta"
            onClick={() => navigate('/trips/new')}
          >
            ✈️ Plan New Trip
          </Button>
        </div>
      </section>

      {/* 5. Budget Highlights & Quick Metric Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon">🗺️</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.total_trips || 0}</span>
            <span className="stat-card__label">Total Trips</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">⏳</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.upcoming_trips_count || 0}</span>
            <span className="stat-card__label">Upcoming Trips</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">💰</div>
          <div className="stat-card__info">
            <span className="stat-card__value">${(stats.total_budget_allocated || 0).toLocaleString()}</span>
            <span className="stat-card__label">Total Budget Target</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">❤️</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.saved_destinations_count || 0}</span>
            <span className="stat-card__label">Saved Places</span>
          </div>
        </div>
      </section>

      {/* 2. Recent & Upcoming Trips List */}
      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">🗓️ Recent Trips</h2>
          <Link to="/trips" className="dashboard-section__link">View all trips →</Link>
        </div>

        {recentTrips.length === 0 ? (
          <EmptyState message="You haven't planned any trips yet.">
            <Button variant="primary" onClick={() => navigate('/trips/new')}>
              Create your first trip
            </Button>
          </EmptyState>
        ) : (
          <div className="trips-grid">
            {recentTrips.map((trip) => {
              const defaultCover =
                trip.cover_photo_url ||
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80';
              return (
                <Link to={`/trips/${trip.trip_id}`} key={trip.trip_id} className="trip-card">
                  <div
                    className="trip-card__cover"
                    style={{ backgroundImage: `url(${defaultCover})` }}
                  >
                    <span className={`trip-card__status-badge trip-card__status-badge--${trip.status || 'upcoming'}`}>
                      {trip.status || 'Planned'}
                    </span>
                  </div>
                  <div className="trip-card__body">
                    <h3 className="trip-card__title">{trip.name}</h3>
                    <div className="trip-card__dates">
                      <span>📅</span>
                      <span>{trip.start_date} → {trip.end_date}</span>
                    </div>
                    <div className="trip-card__meta">
                      <span className="trip-card__stops-badge">
                        📍 {trip.stops_count || 0} {trip.stops_count === 1 ? 'Stop' : 'Stops'}
                      </span>
                      {trip.budget_limit && (
                        <span className="trip-card__budget">
                          ${Number(trip.budget_limit).toLocaleString()} Target
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Recommended Destinations */}
      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">✨ Recommended Destinations</h2>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Top curated global hubs
          </span>
        </div>

        <div className="destinations-grid">
          {recommendedDestinations.map((city) => {
            const cityImg =
              city.image_url ||
              'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80';
            return (
              <div key={city.city_id} className="destination-card">
                <div
                  className="destination-card__image"
                  style={{ backgroundImage: `url(${cityImg})` }}
                >
                  <span className="destination-card__cost-index">
                    {formatCostIndex(city.cost_index)}
                  </span>
                </div>
                <div className="destination-card__body">
                  <span className="destination-card__city">{city.name}</span>
                  <span className="destination-card__country">📍 {city.country} • {city.region || 'Global'}</span>
                  <div className="destination-card__actions">
                    <Button
                      variant="secondary"
                      className="destination-card__btn"
                      onClick={() => navigate(`/trips/new?city=${encodeURIComponent(city.name)}`)}
                    >
                      Plan Trip Here
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
