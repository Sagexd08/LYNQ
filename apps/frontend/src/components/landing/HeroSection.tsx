import { motion } from 'framer-motion';
// TODO: Install @splinetool/react-spline when ready to use 3D models
// import Spline from '@splinetool/react-spline';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section
      id="hero"
      className="min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 lg:px-12 flex flex-col-reverse lg:flex-row items-center justify-between max-w-7xl mx-auto relative z-10"
    >
      {}
      <motion.div
        className="lg:w-1/2 text-center lg:text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] sm:leading-[1.3] text-white">
        <span className="block mb-4">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text mr-2">
            Borrow.
          </span>
          <span className="text-white mr-2">Build.</span>
          <span className="bg-gradient-to-r from-fuchsia-400 via-blue-400 to-teal-300 text-transparent bg-clip-text">
            Belong.
          </span>
        </span>
        <span className="block">
          <span className="text-white mr-2">Only with</span>
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
            LYNQ.
          </span>
        </span>
      </h1>

        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/80 max-w-xl mx-auto lg:mx-0">
          Unlock small and big loans using reputation or stake. Trade, bridge, and borrow — all on-chain.
        </p>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-500 hover:to-cyan-400 text-white px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 border border-cyan-400/30 backdrop-blur-sm"
          >
            Launch App
          </button>
          <button className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-gray-500/30 text-white hover:bg-white/20 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20">
            Build Reputation
          </button>
        </div>

        {}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-white/80 text-sm">
          <div>
            <p className="text-2xl font-bold text-white">266M+</p>
            <span>Total Value Locked</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">180+</p>
            <span>Supported Assets</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">24M+</p>
            <span>Transactions</span>
          </div>
        </div>
      </motion.div>

      {}
      <motion.div
        className="w-full lg:w-1/2 h-[400px] md:h-[500px] lg:h-[600px] relative bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-2xl flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* TODO: Add Spline 3D scene when @splinetool/react-spline is installed */}
        <div className="text-center text-white/50">
          <div className="text-6xl mb-4">🌐</div>
          <p className="text-sm">3D Visualization Placeholder</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-b from-transparent to-black z-10 pointer-events-none" />
      </motion.div>
    </section>
  );
}
