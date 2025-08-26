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

function App() {
  return (
    <Routes>
      {/* These are your public-facing pages */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="howitworks" element={<HowItWorksPage />} />
        <Route path="socialproof" element={<SocialProofPage />} />
      </Route>
      
      {/* These are standalone pages without the main header/footer */}
      <Route path="/activate" element={<OnboardingWizard />} />
      <Route path="/login" element={<LoginPage />} />

      {/* This is your new, secure dashboard route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;