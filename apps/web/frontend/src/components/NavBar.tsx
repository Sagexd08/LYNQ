import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useWalletStore } from "../store/walletStore";

interface NavBarProps {
  onWalletConnect: (walletData: any) => void;
  onShowWalletModal?: () => void;
  useTestnet?: boolean;
  onToggleNetwork?: () => void;
}

function NavBar({
  onWalletConnect,
  onShowWalletModal,
  useTestnet,
  onToggleNetwork,
}: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const address = useWalletStore((state) => state.address);

  const navItems = [
    { path: "/", label: "HOME" },
    { path: "/marketplace", label: "MARKETPLACE" },
    { path: "/dashboard", label: "DASHBOARD" },
    { path: "/cards", label: "LOAN CARDS" },
    { path: "/flashloan", label: "FLASH LOANS" },
  ];

  const handleWalletClick = () => {
    if (address) {
      onWalletConnect("");
    } else if (onShowWalletModal) {
      onShowWalletModal();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-10 md:top-4 md:left-4 md:right-4 lg:left-20 lg:right-20">
        <div className="backdrop-blur-md bg-white/5 border-b-[1px] shadow-[3px_2px_8px_rgba(0,255,255,0.4)] md:rounded-md">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-3 lg:py-4 flex items-center justify-between text-white font-medium">
            <Link to="/" className="text-xl sm:text-2xl font-bold tracking-wide text-accent font-lynq z-10">
              LYNQ
            </Link>

            <ul className="hidden md:flex gap-4 lg:gap-6 items-center">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`text-sm font-medium transition-all relative group px-3 py-2 rounded-lg ${
                      currentPath === item.path
                        ? "text-cyan-400"
                        : "text-white/80 hover:text-cyan-300"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 group-hover:w-full transition-all duration-300 ${
                        currentPath === item.path ? "w-full" : ""
                      }`}
                    ></span>
                  </Link>
                </li>
              ))}
              
              {}
              {onToggleNetwork && (
                <li>
                  <button
                    onClick={onToggleNetwork}
                    className="px-3 lg:px-4 py-2 text-xs lg:text-sm rounded-full bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-400 hover:to-red-400 text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 border border-orange-400/30 backdrop-blur-sm"
                  >
                    {useTestnet ? "Testnet" : "Mainnet"}
                  </button>
                </li>
              )}
              
              <li>
                <button
                  onClick={handleWalletClick}
                  className="px-4 lg:px-6 py-2 text-sm rounded-full bg-gradient-to-r from-cyan-500/80 to-purple-500/80 hover:from-cyan-400 hover:to-purple-400 text-white transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 border border-cyan-400/30 backdrop-blur-sm"
                >
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(
                        -4
                      )}`
                    : "Connect Wallet"}
                </button>
              </li>
            </ul>

            {}
            <div className="md:hidden z-10">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-cyan-400/30 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span
                    className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                      isOpen ? "rotate-45 translate-y-2" : ""
                    }`}
                  ></span>
                  <span
                    className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                      isOpen ? "opacity-0" : ""
                    }`}
                  ></span>
                  <span
                    className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                      isOpen ? "-rotate-45 -translate-y-2" : ""
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </nav>

          {}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="px-4 pb-6 pt-2 space-y-3 bg-gray-900/80 backdrop-blur-lg text-white border-t border-cyan-400/20">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block w-full text-left py-3 px-4 rounded-lg transition-all duration-300 border ${
                        currentPath === item.path
                          ? "bg-cyan-400/20 text-cyan-400 border-cyan-400/30"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-cyan-400/20"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {}
                  {onToggleNetwork && (
                    <button
                      onClick={() => {
                        onToggleNetwork();
                        setIsOpen(false);
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 font-medium"
                    >
                      Switch to {useTestnet ? "Mainnet" : "Testnet"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleWalletClick();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-medium"
                  >
                    {address
                      ? `${address.slice(0, 8)}...${address.slice(
                          -6
                        )}`
                      : "Connect Wallet"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

export default NavBar;
