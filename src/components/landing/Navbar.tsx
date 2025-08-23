import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';

interface LandingNavbarProps {
  onWalletConnect: () => void;
  walletAddress: string;
  onWalletDisconnect: () => void;
}

export default function LandingNavbar({ onWalletConnect, walletAddress, onWalletDisconnect }: LandingNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleWalletClick = () => {
    if (walletAddress) {
      // If wallet is connected, show option to disconnect
      if (onWalletDisconnect) {
        onWalletDisconnect();
      }
    } else {
      // If no wallet connected, open connection modal
      onWalletConnect();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:top-4 md:left-4 md:right-4 lg:left-20 lg:right-20">
      <div className="backdrop-blur-lg bg-black/40 border-b-[1px] md:border-[1px] border-[#1820c4] shadow-[0_0_8px_rgba(0,255,255,0.4)] md:rounded-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-3 lg:py-4 flex items-center justify-between text-white font-medium">
          {/* Logo */}
          <button 
            onClick={() => window.location.reload()}
            className="text-xl sm:text-2xl font-bold tracking-wide text-accent font-lynq cursor-pointer hover:scale-105 transition-transform z-10"
          >
            LYNQ
          </button>

          {/* Desktop Nav */}
          <ul className="hidden md:flex gap-6 lg:gap-8 items-center">
            <li className="relative group">
              <ScrollLink
                to="faq"
                smooth={true}
                duration={500}
                className="cursor-pointer text-sm lg:text-base hover:text-cyan-300 transition-colors"
              >
                FAQ
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
              </ScrollLink>
            </li>
            <li>
              <button 
                onClick={handleWalletClick}
                className="px-4 lg:px-6 py-2 text-sm lg:text-base rounded-full bg-gradient-to-r from-cyan-500/80 to-purple-500/80 hover:from-cyan-400 hover:to-purple-400 text-white transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 border border-cyan-400/30 backdrop-blur-sm"
              >
                {walletAddress 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : 'Connect Wallet'
                }
              </button>
            </li>
          </ul>

          {/* Mobile Menu Toggle - Improved */}
          <div className="md:hidden z-10">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-cyan-400/30 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown - Improved */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-4 pb-6 pt-2 space-y-4 bg-black/80 backdrop-blur-lg text-white border-t border-cyan-400/20">
                <div className="space-y-3">
                  <ScrollLink
                    to="faq"
                    smooth={true}
                    duration={500}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer hover:text-cyan-300 transition-all duration-300 border border-white/10"
                  >
                    FAQ
                  </ScrollLink>
                  <button 
                    onClick={() => {
                      handleWalletClick();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-medium"
                  >
                    {walletAddress 
                      ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
                      : 'Connect Wallet'
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
