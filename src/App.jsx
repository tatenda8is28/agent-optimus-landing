// src/App.jsx

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';

// Import all layouts and pages
import Layout from './Layout.jsx';
import HomePage from './HomePage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import SocialProofPage from './SocialProofPage.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';
import LoginPage from './LoginPage.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import OverviewPage from './OverviewPage.jsx';
import LeadsPage from './LeadsPage.jsx';

// Placeholder components
const AnalyticsPage = () => <div style={{padding: '40px'}}><h1 style={{fontSize: '28px'}}>Analytics (Coming Soon)</h1></div>;
const BuildAgentPage = () => <div style={{padding: '40px'}}><h1 style={{fontSize: '28px'}}>Build My Agent (Coming Soon)</h1></div>;
const CompanyInfoPage = () => <div style={{padding: '40px'}}><h1 style={{fontSize: '28px'}}>Company Info (Coming Soon)</h1></div>;

// The RedirectController logic can remain exactly the same as the last working version.
const RedirectController = () => {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (loading) return;
    const isAuthPage = location.pathname === '/login';
    if (user) {
      if (!userProfile) {
        if (location.pathname !== '/activate') navigate('/activate', { replace: true });
      } else {
        if (isAdmin) {
          if (location.pathname !== '/admin') navigate('/admin', { replace: true });
        } else {
           if (isAuthPage) navigate('/dashboard', { replace: true });
        }
      }
    } else {
      const protectedPages = ['/dashboard', '/admin', '/activate', '/leads', '/analytics', '/build', '/company-info'];
      if (protectedPages.some(page => location.pathname.startsWith(page))) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, userProfile, isAdmin, loading, navigate, location]);
  return null;
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

        {/* --- UPDATED AGENT DASHBOARD ROUTES --- */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/build" element={<BuildAgentPage />} />
          <Route path="/company-info" element={<CompanyInfoPage />} />
        </Route>

        <Route path="/admin" element={ <AdminRoute> <AdminDashboard /> </AdminRoute> } />
      </Routes>
    </>
  );
}

export default App;