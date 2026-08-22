import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const POPULAR_DESTINATIONS = [
  {
    city_id: 2,
    name: 'Tokyo',
    country: 'Japan',
    cost: '$$$ Luxury',
    popularity: 98,
    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 1,
    name: 'Paris',
    country: 'France',
    cost: '$$ Moderate',
    popularity: 96,
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 3,
    name: 'Rome',
    country: 'Italy',
    cost: '$$ Moderate',
    popularity: 94,
    image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 5,
    name: 'Bali',
    country: 'Indonesia',
    cost: '$ Budget',
    popularity: 95,
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 4,
    name: 'New York',
    country: 'United States',
    cost: '$$$ Luxury',
    popularity: 97,
    image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 7,
    name: 'Barcelona',
    country: 'Spain',
    cost: '$$ Moderate',
    popularity: 92,
    image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
  },
];

const CURATED_ACTIVITIES = [
  { name: 'Eiffel Tower Guided Summit Ascent', category: 'Sightseeing', cost: '$35.00', duration: '2 hours', icon: '📸', city: 'Paris, France' },
  { name: 'Montmartre Gourmet Bakery & Wine Tour', category: 'Food & Dining', cost: '$45.00', duration: '2.5 hours', icon: '🍕', city: 'Paris, France' },
  { name: 'Mount Batur Active Volcano Sunrise Hike', category: 'Adventure', cost: '$40.00', duration: '6 hours', icon: '🧗', city: 'Bali, Indonesia' },
  { name: 'Louvre Museum Masterpieces & History Walk', category: 'Culture & History', cost: '$22.00', duration: '3 hours', icon: '🏛️', city: 'Paris, France' },
  { name: 'Shibuya & Harajuku Pop Culture Walking Tour', category: 'Culture & History', cost: '$30.00', duration: '2.5 hours', icon: '🎌', city: 'Tokyo, Japan' },
  { name: 'Tsukiji Outer Market Fresh Sushi Tasting', category: 'Food & Dining', cost: '$50.00', duration: '2 hours', icon: '🍣', city: 'Tokyo, Japan' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredActivities = CURATED_ACTIVITIES.filter((act) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sightseeing') return act.category.includes('Sightseeing');
    if (activeCategory === 'food') return act.category.includes('Food');
    if (activeCategory === 'adventure') return act.category.includes('Adventure');
    if (activeCategory === 'culture') return act.category.includes('Culture');
    return true;
  });

  return (
    <div className="landing-page">
      {/* Background Aurora Glow Orbs */}
      <div className="landing-ambient-glow landing-ambient-glow--1" />
      <div className="landing-ambient-glow landing-ambient-glow--2" />
      <div className="landing-ambient-glow landing-ambient-glow--3" />

      {/* ====================================================================
          1. NAVBAR
          ==================================================================== */}
      <header className="landing-nav">
        <div className="landing-nav__container">
          <Link to="/" className="landing-nav__brand">
            <span className="landing-nav__brand-icon">🌍</span>
            <span>GlobeTrotter</span>
          </Link>

          <nav>
            <ul className="landing-nav__links">
              <li><a href="#home" className="landing-nav__link">Home</a></li>
              <li><a href="#explore" className="landing-nav__link">Explore</a></li>
              <li><a href="#features" className="landing-nav__link">Features</a></li>
              <li><a href="#how-it-works" className="landing-nav__link">How It Works</a></li>
              <li><a href="#why-globetrotter" className="landing-nav__link">Why Us</a></li>
            </ul>
          </nav>

          <div className="landing-nav__actions">
            {isAuthenticated ? (
              <button
                type="button"
                className="landing-nav__signup-btn"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard 🚀
              </button>
            ) : (
              <>
                <Link to="/login" className="landing-nav__login-btn">Log In</Link>
                <Link to="/signup" className="landing-nav__signup-btn">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. HERO — PLAN YOUR JOURNEY, YOUR WAY
          ==================================================================== */}
      <section id="home" className="landing-hero">
        <div className="landing-hero__container">
          <div className="landing-hero__text">
            <div className="landing-hero__badge">
              <span>✨ Intelligent Multi-City Travel Planner</span>
            </div>

            <h1 className="landing-hero__title">
              Plan Your Journey, <br />
              <span className="landing-hero__title-gradient">Your Way.</span>
            </h1>

            <p className="landing-hero__subtitle">
              Design seamless multi-city trips, organize day-by-day itineraries, discover curated local activities, and track your total travel budget in one unified workspace.
            </p>

            <div className="landing-hero__cta-group">
              <Link
                to={isAuthenticated ? '/trips/new' : '/signup'}
                className="landing-hero__cta-primary"
              >
                ✈️ Plan Your Trip
              </Link>
              <a href="#explore" className="landing-hero__cta-secondary">
                🔍 Explore Destinations
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="landing-hero__visual">
            <div className="landing-hero__card-preview">
              <div className="landing-hero__card-img">
                <span className="landing-hero__card-img-title">Tokyo & Kyoto Summer 2026</span>
              </div>
              <div className="landing-hero__card-content">
                <div className="landing-hero__stop-item">
                  <span>📍 Stop 1: Tokyo, Japan</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>4 Days • 5 Activities</span>
                </div>
                <div className="landing-hero__stop-item">
                  <span>📍 Stop 2: Kyoto, Japan</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>3 Days • 3 Activities</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                  <span>💰 Target Budget: <strong>$2,800</strong></span>
                  <span>📅 Jun 1 → Jun 8</span>
                </div>
              </div>
            </div>
            <div className="landing-hero__floating-badge">
              ⚡ Live Itinerary Engine
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. EXPLORE THE WORLD
          ==================================================================== */}
      <section id="explore" className="landing-section">
        <div className="landing-section__container">
          <div className="landing-section__header">
            <span className="landing-section__badge">Curated Global Destinations</span>
            <h2 className="landing-section__title">Explore the World</h2>
            <p className="landing-section__subtitle">
              Browse top destinations with real-time cost indices and traveler popularity scores to find your next adventure.
            </p>
          </div>

          <div className="dest-grid">
            {POPULAR_DESTINATIONS.map((city) => (
              <div key={city.city_id} className="dest-card">
                <div
                  className="dest-card__image"
                  style={{ backgroundImage: `url(${city.image_url})` }}
                >
                  <span className="dest-card__popularity">★ {city.popularity}% Popularity</span>
                  <span className="dest-card__cost">{city.cost}</span>
                </div>
                <div className="dest-card__body">
                  <h3 className="dest-card__name">{city.name}</h3>
                  <p className="dest-card__country">📍 {city.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. PLAN MULTI-CITY TRIPS
          ==================================================================== */}
      <section id="features" className="landing-section landing-section--alt">
        <div className="landing-section__container">
          <div className="feature-split">
            <div className="feature-split__text">
              <span className="feature-split__tag">Multi-City Engine</span>
              <h2 className="feature-split__title">Plan Multi-City Trips With Ease</h2>
              <p className="feature-split__desc">
                Stop juggling messy spreadsheets. Add multiple destinations to a single journey, assign dates, and effortlessly reorder stops with one-click sequencing.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">✨ Add multiple cities in sequential route order</li>
                <li className="feature-split__item">⏱️ Automatic stay duration calculations</li>
                <li className="feature-split__item">🔄 Drag-free one-click stop reordering</li>
                <li className="feature-split__item">🏨 Custom transit notes, hotel stays, and flight details</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#4f46e5', fontSize: '1.05rem' }}>Stop #1: Paris, France</strong>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Jun 1 → Jun 5 (5 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.4rem' }}>✈️</span>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#0891b2', fontSize: '1.05rem' }}>Stop #2: Rome, Italy</strong>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Jun 5 → Jun 9 (4 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.4rem' }}>🚆</span>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#e11d48', fontSize: '1.05rem' }}>Stop #3: Barcelona, Spain</strong>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Jun 9 → Jun 14 (5 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.4rem' }}>🏖️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. DISCOVER THINGS TO DO
          ==================================================================== */}
      <section className="landing-section">
        <div className="landing-section__container">
          <div className="landing-section__header">
            <span className="landing-section__badge">Curated Catalog</span>
            <h2 className="landing-section__title">Discover Things to Do</h2>
            <p className="landing-section__subtitle">
              Filter top-rated tours, culinary tastings, adventures, and landmarks by category, cost, and duration.
            </p>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginBottom: '2.75rem', flexWrap: 'wrap' }}>
            {['all', 'sightseeing', 'food', 'adventure', 'culture'].map((cat) => (
              <button
                key={cat}
                type="button"
                style={{
                  padding: '0.55rem 1.4rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  background: activeCategory === cat ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--color-surface)',
                  color: activeCategory === cat ? 'white' : 'var(--color-text)',
                  border: activeCategory === cat ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  borderRadius: '9999px',
                  boxShadow: activeCategory === cat ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? '🌟 All Activities' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.75rem' }}>
            {filteredActivities.map((act) => (
              <div
                key={act.name}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <span style={{ fontSize: '2.25rem' }}>{act.icon}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 750 }}>{act.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  📍 {act.city} • ⏱️ {act.duration}
                </span>
                <div style={{ marginTop: 'auto', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '1.15rem' }}>{act.cost}</span>
                  <span style={{ fontSize: '0.825rem', color: '#6366f1', fontWeight: 700 }}>+ Add to Trip</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. BUILD YOUR PERFECT ITINERARY & VISUALIZE YOUR JOURNEY
          ==================================================================== */}
      <section id="how-it-works" className="landing-section landing-section--alt">
        <div className="landing-section__container">
          <div className="feature-split feature-split--reverse">
            <div className="feature-split__text">
              <span className="feature-split__tag">Day-by-Day Precision</span>
              <h2 className="feature-split__title">Build Your Perfect Itinerary</h2>
              <p className="feature-split__desc">
                Organize every day with specific time slots, activities, and transit markers. Switch between Builder Mode and a clean presentation Itinerary View anytime.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">🗓️ Day-by-day structured activity schedule</li>
                <li className="feature-split__item">⏰ Custom start times and duration tracking</li>
                <li className="feature-split__item">👁️ Clean presentation view (skips calendar complexity)</li>
                <li className="feature-split__item">🖨️ One-click Print & PDF export</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4f46e5' }}>
                  Day 1 • Jun 1 — Tokyo Arrival
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏰ 10:00 AM • 📸 Shibuya Crossing Walking Tour</span>
                  <strong>$30.00</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏰ 02:30 PM • 🍣 Tsukiji Market Street Food</span>
                  <strong>$50.00</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏰ 06:00 PM • 🏛️ teamLab Planets Digital Art</span>
                  <strong>$28.00</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. KNOW YOUR TRIP BUDGET
          ==================================================================== */}
      <section className="landing-section">
        <div className="landing-section__container">
          <div className="feature-split">
            <div className="feature-split__text">
              <span className="feature-split__tag">Expense & Cost Tracking</span>
              <h2 className="feature-split__title">Know Your Trip Budget Before You Fly</h2>
              <p className="feature-split__desc">
                Set a target budget and monitor real-time breakdowns across Transport, Accommodation, Activities, Meals, and Miscellaneous expenses.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">💰 Target budget comparison and live variance</li>
                <li className="feature-split__item">📊 Automated category breakdown (Stay, Meals, Transport)</li>
                <li className="feature-split__item">⚠️ Over-budget visual alert highlights</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div className="budget-widget-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Total Spent: $1,620</span>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>$880 Under Target</span>
                </div>

                <div className="budget-widget-bar">
                  <div className="budget-widget-segment" style={{ width: '40%', background: '#6366f1' }} />
                  <div className="budget-widget-segment" style={{ width: '25%', background: '#10b981' }} />
                  <div className="budget-widget-segment" style={{ width: '20%', background: '#f59e0b' }} />
                  <div className="budget-widget-segment" style={{ width: '15%', background: '#ec4899' }} />
                </div>

                <div className="budget-widget-grid">
                  <div className="budget-widget-pill">
                    <span>🏨 Stay</span>
                    <strong>$650</strong>
                  </div>
                  <div className="budget-widget-pill">
                    <span>✈️ Transport</span>
                    <strong>$420</strong>
                  </div>
                  <div className="budget-widget-pill">
                    <span>🎟️ Activities</span>
                    <strong>$330</strong>
                  </div>
                  <div className="budget-widget-pill">
                    <span>🍕 Meals</span>
                    <strong>$220</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. SHARE YOUR ADVENTURE
          ==================================================================== */}
      <section className="landing-section landing-section--alt">
        <div className="landing-section__container">
          <div className="feature-split feature-split--reverse">
            <div className="feature-split__text">
              <span className="feature-split__tag">Collaboration & Sharing</span>
              <h2 className="feature-split__title">Share Your Adventure with Friends</h2>
              <p className="feature-split__desc">
                Generate a clean, shareable public URL with read-only view permissions. Friends can view your route or clone the trip with the one-click **"Copy Trip"** feature.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">🔗 Instant shareable link generation</li>
                <li className="feature-split__item">🔒 Read-only view / Viewer permissions</li>
                <li className="feature-split__item">📋 "Copy Trip" duplicate itinerary for personal use</li>
              </ul>
            </div>

            <div className="feature-split__preview-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }}>🔗</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>https://globetrotter.app/trips/share/tokyo-2026</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Anyone with this link can view your itinerary without signing in.
              </p>
              <button
                type="button"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '0.65rem 1.5rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => alert('Demo Share Link Copied!')}
              >
                📋 Copy Share Link
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. WHY GLOBETROTTER?
          ==================================================================== */}
      <section id="why-globetrotter" className="landing-section">
        <div className="landing-section__container">
          <div className="landing-section__header">
            <span className="landing-section__badge">Key Advantages</span>
            <h2 className="landing-section__title">Why GlobeTrotter?</h2>
            <p className="landing-section__subtitle">
              Built specifically for modern travelers seeking seamless organization without unnecessary complexity.
            </p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-card__icon why-card__icon--1">🗺️</div>
              <h3 className="why-card__title">Personalized Planning</h3>
              <p className="why-card__text">
                Custom itineraries tailored to your exact dates, cities, and pace of exploration.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon why-card__icon--2">🚆</div>
              <h3 className="why-card__title">Multi-City Support</h3>
              <p className="why-card__text">
                Effortlessly manage complex routes across multiple countries and destinations.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon why-card__icon--3">🎟️</div>
              <h3 className="why-card__title">Activity Discovery</h3>
              <p className="why-card__text">
                Browse curated sightseeing tours, foodie walks, and outdoor adventures per city.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon why-card__icon--4">💰</div>
              <h3 className="why-card__title">Budget Awareness</h3>
              <p className="why-card__text">
                Real-time expense categorization keeps you informed and on track financially.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon why-card__icon--5">🤝</div>
              <h3 className="why-card__title">Easy Sharing</h3>
              <p className="why-card__text">
                Share read-only itineraries and let friends clone your plans with "Copy Trip".
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="landing-cta-banner">
            <h2 className="landing-cta-banner__title">Ready to Start Planning Your Journey?</h2>
            <p className="landing-cta-banner__subtitle">
              Join thousands of travelers crafting unforgettable trips with GlobeTrotter today.
            </p>
            <Link
              to={isAuthenticated ? '/trips/new' : '/signup'}
              className="landing-cta-banner__btn"
            >
              🚀 Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. FOOTER
          ==================================================================== */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div>
            <div className="landing-footer__brand">
              <span>🌍</span>
              <span>GlobeTrotter</span>
            </div>
            <p className="landing-footer__desc">
              The modern travel companion for multi-city itinerary planning, budget tracking, and global adventure discovery.
            </p>
          </div>

          <div>
            <h4 className="landing-footer__heading">Explore</h4>
            <ul className="landing-footer__list">
              <li><a href="#explore" className="landing-footer__link">Popular Destinations</a></li>
              <li><a href="#features" className="landing-footer__link">Multi-City Routes</a></li>
              <li><a href="#explore" className="landing-footer__link">Curated Activities</a></li>
              <li><a href="#why-globetrotter" className="landing-footer__link">Travel Guides</a></li>
            </ul>
          </div>

          <div>
            <h4 className="landing-footer__heading">Product</h4>
            <ul className="landing-footer__list">
              <li><a href="#features" className="landing-footer__link">Itinerary Builder</a></li>
              <li><a href="#features" className="landing-footer__link">Budget Highlights</a></li>
              <li><a href="#how-it-works" className="landing-footer__link">Sharing & Permissions</a></li>
              <li><Link to="/login" className="landing-footer__link">Account Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="landing-footer__heading">Company</h4>
            <ul className="landing-footer__list">
              <li><a href="#why-globetrotter" className="landing-footer__link">About Us</a></li>
              <li><a href="#why-globetrotter" className="landing-footer__link">Contact Support</a></li>
              <li><a href="#why-globetrotter" className="landing-footer__link">Privacy Policy</a></li>
              <li><a href="#why-globetrotter" className="landing-footer__link">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>© {new Date().getFullYear()} GlobeTrotter. All rights reserved.</span>
          <span>Designed with ❤️ for Global Explorers</span>
        </div>
      </footer>
    </div>
  );
}
