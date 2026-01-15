import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingV2 from './pages/landing/LandingV2';
import LearningPage from './pages/learning';
import OnboardingPage from './pages/learning/Onboarding';
import DashboardPage from './pages/app/dashboard';
import IntelligencePage from './pages/app/intelligence';
import ProtocolPage from './pages/app/protocol';
import MarketsPage from './pages/app/markets';
import RiskPage from './pages/app/risk';
import PortfolioPage from './pages/app/portfolio';
import ReputationPage from './pages/app/reputation';
import SettingsPage from './pages/app/settings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingV2 />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Legacy App Route (redirects to dashboard) */}
        <Route path="/app" element={<DashboardPage />} />

        {/* Bloomberg-grade Dashboard Routes */}
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/intelligence" element={<IntelligencePage />} />
        <Route path="/app/protocol" element={<ProtocolPage />} />
        <Route path="/app/markets" element={<MarketsPage />} />
        <Route path="/app/risk" element={<RiskPage />} />
        <Route path="/app/portfolio" element={<PortfolioPage />} />
        <Route path="/app/reputation" element={<ReputationPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
