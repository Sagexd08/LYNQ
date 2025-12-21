import { motion } from 'framer-motion';
import BlurText from '../reactbits/BlurText';
import ScaleIn from '../reactbits/ScaleIn';
import Glow from '../reactbits/Glow';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section
      id="hero"
      className="min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 lg:px-12 flex flex-col-reverse lg:flex-row items-center justify-between max-w-7xl mx-auto relative z-10"
    >
      { }
      <motion.div
        className="lg:w-1/2 text-center lg:text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ScaleIn delay={0.2}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white drop-shadow-lg font-heading">
            <span className="block mb-2">
              AI-Powered Credit
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-electric-blue to-deep-purple animate-pulse-slow">
              for the Multi-Chain Future
            </span>
          </h1>
        </ScaleIn>

        <motion.div className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto lg:mx-0 font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
          <BlurText
            text="Instantly analyze risk, forecast defaults, and access capital. The first lending protocol built on true machine intelligence."
            delay={0.05}
            animateBy="words"
            direction="bottom"
          />
        </motion.div>

        <motion.div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
          <Glow color="cyan" intensity="medium">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-electric-blue hover:bg-neon-cyan text-black font-bold px-8 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105 border border-cyan-400/30 shadow-[0_0_20px_rgba(41,121,255,0.5)]"
            >
              Launch App
            </button>
          </Glow>
          <button className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-full transition-all duration-300 hover:border-dneon-cyan/50 font-medium">
            Explore Intelligence
          </button>
        </motion.div>

        <motion.div className="mt-16 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left text-white/60">
          <div className="border-l-2 border-neon-cyan pl-4">
            <p className="text-3xl font-bold text-white font-mono">$420M+</p>
            <span className="text-sm uppercase tracking-wider">Total Value Locked</span>
          </div>
          <div className="border-l-2 border-deep-purple pl-4">
            <p className="text-3xl font-bold text-white font-mono">15,000+</p>
            <span className="text-sm uppercase tracking-wider">Loans Issued</span>
          </div>
          <div className="border-l-2 border-magenta pl-4">
            <p className="text-3xl font-bold text-white font-mono">98.4%</p>
            <span className="text-sm uppercase tracking-wider">ML Accuracy</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
