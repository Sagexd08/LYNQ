import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Reputation from '../components/landing/Reputation';
import Footer from '../components/landing/Footer';
import BuiltOnEthereum from '../components/landing/BuiltOnEthereum';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <HeroSection onGetStarted={onGetStarted} />
      <Features />
      <BuiltOnEthereum />
      <CTASection onGetStarted={onGetStarted} />
      <Reputation />
      <Footer />
    </div>
  );
};

export default Landing;
