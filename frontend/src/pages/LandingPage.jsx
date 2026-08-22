import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './LandingPage.css';

const POPULAR_DESTINATIONS = [
  {
    city_id: 2,
    name: 'Tokyo',
    country: 'Japan',
    cost: '$$$ Luxury',
    popularity: 96,
    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 1,
    name: 'Paris',
    country: 'France',
    cost: '$$ Moderate',
    popularity: 98,
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
    popularity: 92,
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 4,
    name: 'New York',
    country: 'United States',
    cost: '$$$ Luxury',
    popularity: 95,
    image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
  },
  {
    city_id: 7,
    name: 'Barcelona',
    country: 'Spain',
    cost: '$$ Moderate',
    popularity: 91,
    image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
  },
];

const CURATED_ACTIVITIES = [
  { name: 'Eiffel Tower Guided Ascent', category: 'Sightseeing', cost: '$35.00', duration: '2 hours', icon: '📸' },
  { name: 'Montmartre Bakery & Wine Walk', category: 'Food & Dining', cost: '$45.00', duration: '2.5 hours', icon: '🍕' },
  { name: 'Mount Batur Volcano Sunrise Trek', category: 'Adventure', cost: '$40.00', duration: '6 hours', icon: '🧗' },
  { name: 'Louvre Museum Masterpieces Tour', category: 'Culture & History', cost: '$22.00', duration: '3 hours', icon: '🏛️' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
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
              <li><a href="#about" className="landing-nav__link">About</a></li>
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
              <span>✈️ The Smart Multi-City Travel Planner</span>
            </div>

            <h1 className="landing-hero__title">
              Plan Your Journey, <br />
              <span className="landing-hero__title-gradient">Your Way</span>
            </h1>

            <p className="landing-hero__subtitle">
              Design seamless multi-city trips, organize day-by-day itineraries, discover curated activities, and track your total travel budget in one unified workspace.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <span>💰 Target Budget: $2,800</span>
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
            <span className="landing-section__badge">Global Catalog</span>
            <h2 className="landing-section__title">Explore the World</h2>
            <p className="landing-section__subtitle">
              Browse top destinations with real-time cost indices and popularity scores to find your next adventure.
            </p>
          </div>

          <div className="dest-grid">
            {POPULAR_DESTINATIONS.map((city) => (
              <div key={city.city_id} className="dest-card">
                <div
                  className="dest-card__image"
                  style={{ backgroundImage: `url(${city.image_url})` }}
                >
                  <span className="dest-card__popularity">★ {city.popularity}% match</span>
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
              <span className="feature-split__tag">Route Optimization</span>
              <h2 className="feature-split__title">Plan Multi-City Trips With Ease</h2>
              <p className="feature-split__desc">
                Stop juggling messy spreadsheets. Add multiple destinations to a single journey, assign dates, and effortlessly reorder stops with one-click sequencing.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">✅ Add multiple cities in sequential route order</li>
                <li className="feature-split__item">✅ Automatic stay duration calculations</li>
                <li className="feature-split__item">✅ Drag-free one-click stop reordering</li>
                <li className="feature-split__item">✅ Custom transit notes and hotel stays</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem', background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e3a8a' }}>Stop #1: Paris, France</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Jun 1 → Jun 5 (5 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>✈️</span>
                </div>

                <div style={{ padding: '0.85rem', background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e3a8a' }}>Stop #2: Rome, Italy</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Jun 5 → Jun 9 (4 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>🚆</span>
                </div>

                <div style={{ padding: '0.85rem', background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e3a8a' }}>Stop #3: Barcelona, Spain</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Jun 9 → Jun 14 (5 Days)</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>🏖️</span>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {['all', 'sightseeing', 'food', 'adventure', 'culture'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`preset-chip ${activeCategory === cat ? 'preset-chip--active' : ''}`}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.9rem',
                  background: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: activeCategory === cat ? 'white' : 'var(--color-text)',
                  borderColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                  cursor: 'pointer',
                  borderRadius: '9999px',
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? '🌟 All Activities' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {filteredActivities.map((act) => (
              <div
                key={act.name}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{act.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{act.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  🏷️ {act.category} • ⏱️ {act.duration}
                </span>
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>{act.cost}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>+ Add to Trip</span>
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
              <span className="feature-split__tag">Day-by-Day Scheduling</span>
              <h2 className="feature-split__title">Build Your Perfect Itinerary</h2>
              <p className="feature-split__desc">
                Organize every day with specific time slots, activities, and transit markers. Switch between Builder Mode and a clean presentation Itinerary View anytime.
              </p>
              <ul className="feature-split__list">
                <li className="feature-split__item">📅 Day-by-day structured activity list</li>
                <li className="feature-split__item">⏰ Custom start times and duration tracking</li>
                <li className="feature-split__item">👁️ Clean presentation view (skip calendar complexity)</li>
                <li className="feature-split__item">🖨️ One-click Print & PDF export</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                  Day 1 • Jun 1 — Tokyo Arrival
                </div>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏰ 10:00 AM • 📸 Shibuya Crossing Walking Tour</span>
                  <strong>$30.00</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏰ 02:30 PM • 🍕 Tsukiji Market Street Food</span>
                  <strong>$50.00</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
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
                <li className="feature-split__item">💰 Target budget comparison and variance</li>
                <li className="feature-split__item">📊 Automated category breakdown (Stay, Meals, Transport)</li>
                <li className="feature-split__item">⚠️ Over-budget visual alert highlights</li>
              </ul>
            </div>

            <div className="feature-split__preview-box">
              <div className="budget-widget-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Total Spent: $1,620</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>$880 Under Target</span>
                </div>

                <div className="budget-widget-bar">
                  <div className="budget-widget-segment" style={{ width: '40%', background: '#1a73e8' }} />
                  <div className="budget-widget-segment" style={{ width: '25%', background: '#10b981' }} />
                  <div className="budget-widget-segment" style={{ width: '20%', background: '#f59e0b' }} />
                  <div className="budget-widget-segment" style={{ width: '15%', background: '#8b5cf6' }} />
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
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔗</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>https://globetrotter.app/trips/share/tokyo-2026</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                Anyone with this link can view your itinerary without signing in.
              </p>
              <button
                type="button"
                className="preset-chip"
                style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.5rem 1.25rem', fontWeight: 600 }}
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
      <section id="about" className="landing-section">
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
              <div className="why-card__icon">🗺️</div>
              <h3 className="why-card__title">Personalized Planning</h3>
              <p className="why-card__text">
                Custom itineraries tailored to your exact dates, cities, and pace of exploration.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon">🚆</div>
              <h3 className="why-card__title">Multi-City Support</h3>
              <p className="why-card__text">
                Effortlessly manage complex routes across multiple countries and destinations.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon">🎟️</div>
              <h3 className="why-card__title">Activity Discovery</h3>
              <p className="why-card__text">
                Browse curated sightseeing tours, foodie walks, and outdoor adventures per city.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon">💰</div>
              <h3 className="why-card__title">Budget Awareness</h3>
              <p className="why-card__text">
                Real-time expense categorization keeps you informed and on track financially.
              </p>
            </div>

            <div className="why-card">
              <div className="why-card__icon">🤝</div>
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
              <li><a href="#about" className="landing-footer__link">Travel Guides</a></li>
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
              <li><a href="#about" className="landing-footer__link">About Us</a></li>
              <li><a href="#about" className="landing-footer__link">Contact Support</a></li>
              <li><a href="#about" className="landing-footer__link">Privacy Policy</a></li>
              <li><a href="#about" className="landing-footer__link">Terms of Service</a></li>
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
