import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingV2 from './pages/landing/LandingV2';
import LearningPage from './pages/learning';
import AppPage from './pages/app';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingV2 />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </Router>
  );
}

export default App;
