import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

/* ---- Pages ---- */
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TripsListPage from './pages/TripsListPage';
import CreateTripPage from './pages/CreateTripPage';
import ItineraryPage from './pages/ItineraryPage';
import BudgetPage from './pages/BudgetPage';
import ProfilePage from './pages/ProfilePage';

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';
  const showSidebar = isAuthenticated && !isPublicPage;

  return (
    <div className={`app ${showSidebar ? 'app--authenticated' : 'app--public'}`}>
      {showSidebar && <Sidebar />}

      <main className={`app__content ${showSidebar ? 'app__content--with-sidebar' : 'app__content--full'}`}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute><TripsListPage /></ProtectedRoute>
          } />
          <Route path="/trips/new" element={
            <ProtectedRoute><CreateTripPage /></ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute><ItineraryPage /></ProtectedRoute>
          } />
          <Route path="/trips/:id/budget" element={
            <ProtectedRoute><BudgetPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
