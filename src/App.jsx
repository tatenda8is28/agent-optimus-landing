import { Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import HomePage from './HomePage.jsx'
import HowItWorksPage from './HowItWorksPage.jsx'
import SocialProofPage from './SocialProofPage.jsx'
import OnboardingWizard from './OnboardingWizard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="howitworks" element={<HowItWorksPage />} />
        <Route path="socialproof" element={<SocialProofPage />} />
      </Route>
      <Route path="/activate" element={<OnboardingWizard />} />
    </Routes>
  )
}

export default App