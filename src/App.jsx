// src/App.jsx

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';

import Layout from './Layout.jsx';
import HomePage from './HomePage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import SocialProofPage from './SocialProofPage.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';
import LoginPage from './LoginPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminRoute from './AdminRoute.jsx';

// --- NEW REDIRECT CONTROLLER ---
const RedirectController = () => {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't do anything until the auth state is fully resolved
    if (loading) {
      return;
    }

    const isAuthPage = location.pathname === '/login' || location.pathname === '/activate';

    if (user) {
      // User is LOGGED IN
      if (!userProfile) {
        // New user, must complete profile. Redirect to wizard if not already there.
        if (location.pathname !== '/activate') {
          navigate('/activate', { replace: true });
        }
      } else {
        // Existing user with a profile.
        if (isAdmin) {
          // Admin user. Redirect to admin page if not already there.
          if (location.pathname !== '/admin') {
            navigate('/admin', { replace: true });
          }
        } else {
          // Regular agent. Redirect to dashboard if they are on an auth page.
          if (isAuthPage) {
            navigate('/dashboard', { replace: true });
          }
        }
      }
    } else {
      // User is LOGGED OUT.
      // If they try to access a protected page, send them to login.
      const protectedPages = ['/dashboard', '/admin', '/activate'];
      if (protectedPages.includes(location.pathname)) {
        navigate('/login', { replace: true });
      }
    }

  }, [user, userProfile, isAdmin, loading, navigate, location]);

  return null; // This component renders nothing.
};


function App() {
  return (
    <>
      <RedirectController />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="howitworks" element={<HowItWorksPage />} />
          <Route path="socialproof" element={<SocialProofPage />} />
        </Route>
        
        <Route path="/activate" element={<OnboardingWizard />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } />
        <Route path="/admin" element={ <AdminRoute> <AdminDashboard /> </AdminRoute> } />
      </Routes>
    </>
  );
}

export default App;