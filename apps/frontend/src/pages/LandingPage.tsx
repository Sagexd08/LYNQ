import React, { useState } from 'react';
import LandingNavbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Reputation from '../components/landing/Reputation';
import Footer from '../components/landing/Footer';
import BuiltOnEthereum from '../components/landing/BuiltOnEthereum';
import { LazyWalletConnectionModal } from '../lazyComponents';
import { Suspense } from 'react';

const LandingPage: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleShowWalletModal = () => {
    setShowWalletModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <LandingNavbar
        onShowWalletModal={handleShowWalletModal}
      />
      <main>
        <HeroSection onGetStarted={handleShowWalletModal} />
        <Features />
        <BuiltOnEthereum />
        <Reputation />
        <CTASection onGetStarted={handleShowWalletModal} />
      </main>
      <Footer />
      {showWalletModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        }>
          <LazyWalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onWalletConnect={() => setShowWalletModal(false)}
            isLandingPage={true}
          />
        </Suspense>
      )}
    </div>
  );
};

export default LandingPage;
