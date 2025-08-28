// src/App.jsx --- FINAL CORRECT VERSION

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';

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
import LeadsPage from './LeadsPage.jsx';

const BuildAgentPage = () => <div style={{padding: '40px'}}><h1 style={{fontSize: '28px'}}>Build My Agent (Coming Soon)</h1></div>;
const CompanyInfoPage = () => <div style={{padding: '40px'}}><h1 style={{fontSize: '28px'}}>Company Info (Coming Soon)</h1></div>;

const RedirectController = () => {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isAuthPage = location.pathname === '/login';
    const isAgentDashboard = location.pathname.startsWith('/dashboard');

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
      const protectedPages = ['/dashboard', '/admin', '/activate', '/build', '/company-info'];
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

        {/* NOTE: The dashboard path is now the parent */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<LeadsPage />} />
          <Route path="/build" element={<BuildAgentPage />} />
          <Route path="/company-info" element={<CompanyInfoPage />} />
        </Route>

        <Route path="/admin" element={ <AdminRoute> <AdminDashboard /> </AdminRoute> } />
      </Routes>
    </>
  );
}

export default App;