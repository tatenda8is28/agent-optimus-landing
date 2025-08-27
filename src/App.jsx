// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import HomePage from './HomePage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import SocialProofPage from './SocialProofPage.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';
import LoginPage from './LoginPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminDashboard from './AdminDashboard.jsx'; // <-- IMPORT aDMIN DASHBOARD
import AdminRoute from './AdminRoute.jsx';       // <-- IMPORT aDMIN ROUTE

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="howitworks" element={<HowItWorksPage />} />
        <Route path="socialproof" element={<SocialProofPage />} />
      </Route>
      
      <Route path="/activate" element={<OnboardingWizard />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Standard Protected Route for Agents */}
      <Route 
        path="/dashboard" 
        element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } 
      />

      {/* NEW Admin-Only Protected Route */}
      <Route 
        path="/admin"
        element={ <AdminRoute> <AdminDashboard /> </AdminRoute> }
      />
    </Routes>
  );
}

export default App;