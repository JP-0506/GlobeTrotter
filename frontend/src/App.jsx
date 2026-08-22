import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

/* ---- Pages ---- */
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

  return (
    <div className={`app ${isAuthenticated ? 'app--authenticated' : 'app--public'}`}>
      {isAuthenticated && <Sidebar />}

      <main className={`app__content ${isAuthenticated ? 'app__content--with-sidebar' : ''}`}>
        <Routes>
          {/* Public routes */}
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

          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
