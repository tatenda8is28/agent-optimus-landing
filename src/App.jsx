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
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';

// Agent Dashboard Imports
import DashboardLayout from './DashboardLayout.jsx';
import OverviewPage from './OverviewPage.jsx';
import LeadsPage from './LeadsPage.jsx';
import AnalyticsPage from './AnalyticsPage.jsx';
import BuildAgentPage from './BuildAgentPage.jsx';
import CompanyInfoPage from './CompanyInfoPage.jsx';
import AccountPage from './AccountPage.jsx';

// Admin Dashboard Imports
import AdminDashboard from './AdminDashboard.jsx';
import AdminAgentDetailPage from './AdminAgentDetailPage.jsx';


// The RedirectController logic
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
          if (!location.pathname.startsWith('/admin')) navigate('/admin', { replace: true });
        } else {
           if (isAuthPage || location.pathname.startsWith('/admin')) navigate('/dashboard', { replace: true });
        }
      }
    } else {
      const protectedPages = ['/dashboard', '/admin', '/activate', '/leads', '/analytics', '/build', '/company-info', '/account'];
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
        {/* Public Marketing Site Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="howitworks" element={<HowItWorksPage />} />
          <Route path="socialproof" element={<SocialProofPage />} />
        </Route>
        
        {/* Standalone Auth/Onboarding Routes */}
        <Route path="/activate" element={<OnboardingWizard />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Agent Dashboard Routes (all protected) */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/build" element={<BuildAgentPage />} />
          <Route path="/company-info" element={<CompanyInfoPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        {/* Admin-Only Routes (all protected by AdminRoute) */}
        <Route path="/admin" element={ <AdminRoute> <AdminDashboard /> </AdminRoute> } />
        <Route path="/admin/users/:userId" element={ <AdminRoute> <AdminAgentDetailPage /> </AdminRoute> } />

      </Routes>
    </>
  );
}

export default App;