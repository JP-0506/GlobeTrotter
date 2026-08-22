# 🌍 GlobeTrotter

Full-stack Travel Planning Application built with **Django + SQLite** (Backend) and **React + Vite** (Frontend).

---

## 📁 Repository Structure

```
globeTrotter/
├── frontend/                   # React + Vite frontend application
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite config (@ alias, API proxy to Django)
│   ├── .env.example            # Environment template (VITE_API_URL)
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx            # React entry
│   │   ├── App.jsx             # Root routing & AuthProvider
│   │   ├── api/
│   │   │   └── client.js       # fetch() wrapper (JWT auth, JSON parsing)
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state: user, token, login(), logout()
│   │   ├── components/         # Shared UI components
│   │   │   ├── index.js        # Barrel export
│   │   │   ├── Button.jsx      # <Button variant="primary|secondary|danger">
│   │   │   ├── Card.jsx        # <Card> container
│   │   │   ├── Input.jsx       # <Input label="" type="" error="" />
│   │   │   ├── LoadingSpinner.jsx # <LoadingSpinner size="sm|md|lg" />
│   │   │   ├── EmptyState.jsx  # <EmptyState message="No trips yet" />
│   │   │   ├── Navbar.jsx      # Fixed top navbar
│   │   │   ├── ProtectedRoute.jsx # Route auth guard
│   │   │   └── *.css           # Component styles
│   │   ├── pages/              # Routed screen pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TripsListPage.jsx
│   │   │   ├── CreateTripPage.jsx
│   │   │   ├── ItineraryPage.jsx
│   │   │   ├── BudgetPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   └── styles/
│   │       └── variables.css   # CSS variables (colors, spacing, radii, font)
│
├── backend/                    # Django backend application
│   ├── models.py               # Django ORM models (SQLite database schema)
│   └── requirements.txt        # Python backend dependencies
│
├── .gitignore                  # Git ignore rules for frontend & backend
└── README.md                   # Project documentation & team assignments
```

---

## 🚀 Getting Started

### 1. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
> Runs at `http://localhost:5173`. Proxies `/api` requests to Django at `http://localhost:8000`.

### 2. Backend Setup (Django + SQLite)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
> Runs at `http://localhost:8000`.

---

## 👥 Team Split & Ownership

| Member | Role | Frontend Files | Route(s) | Backend Tables / Models |
|--------|------|----------------|----------|-------------------------|
| **Person 1** | Auth & Trip Shell | `LoginPage.jsx`, `SignupPage.jsx`, `DashboardPage.jsx`, `TripsListPage.jsx`, `CreateTripPage.jsx`, `ProfilePage.jsx` | `/login`, `/signup`, `/dashboard`, `/trips`, `/trips/new`, `/profile` | `users` (`User`), `trips` (`Trip`), `saved_destinations`, `trip_shares`, `trip_copies` |
| **Person 2** | Itinerary Builder | `ItineraryPage.jsx` | `/trips/:id` | `trip_stops` (`TripStop`), `trip_activities` (`TripActivity`) |
| **Person 3** | Cities & Activities Data | `src/components/CityPicker.jsx`, `src/components/ActivityPicker.jsx` | Component layer | `cities` (`City`), `activities` (`Activity`) + Seed script |
| **Person 4** | Budget | `BudgetPage.jsx` | `/trips/:id/budget` | `budget_items` (`BudgetItem`) |

### Dependency Chain

```
Person 1 (trips) ───► Person 2 (stops/activities) ───► Person 4 (budget rolls up from activities)
                              ▲
                              │
                      Person 3 (city/activity picker components)
```

---

## 🗄️ Database Models (`backend/models.py`)

All models are defined in [backend/models.py](file:///d:/GlobeTrotter/globeTrotter/backend/models.py) matching the schema:

1. `User` (`users`): Email auth, `name`, `photo_url`, `language_pref`, `is_admin`, timestamps.
2. `City` (`cities`): `name`, `country`, `cost_index`, `popularity`, `latitude`, `longitude`, `(name, country)` unique.
3. `Activity` (`activities`): FK `City`, `name`, `category`, `cost`, `duration_minutes`, `image_url`.
4. `Trip` (`trips`): FK `User`, `name`, `start_date`, `end_date`, `budget_limit`, `public_slug`, `is_public`.
5. `TripStop` (`trip_stops`): FK `Trip`, FK `City`, `sequence_order`, `arrival_date`, `departure_date`, check constraints & validations.
6. `TripActivity` (`trip_activities`): FK `TripStop`, FK `Activity`, `scheduled_date`, `cost_override`, `effective_cost` property.
7. `BudgetItem` (`budget_items`): FK `Trip`, optional FK `TripStop`, `category`, `amount`, `expense_date`.
8. `SavedDestination` (`saved_destinations`): Composite unique on `(user, city)`.
9. `TripShare` (`trip_shares`): FK `Trip`, FK `User`, `permission` (`view`/`edit`).
10. `TripCopy` (`trip_copies`): Lineage tracking for copied trips.
