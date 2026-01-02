import React, { useState, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Brain,
  ArrowRight,
  Activity,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfidenceRing } from '../components/lynq/ConfidenceRing';
import { RiskMeter } from '../components/lynq/RiskMeter';

const WalletConnectionModal = React.lazy(() => import('../components/wallet/WalletConnectionModal'));

const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; yOffset?: number }> = ({
  children, delay = 0, duration = 6, yOffset = 20
}) => (
  <motion.div
    animate={{
      y: [0, -yOffset, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
);

const LandingPage: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-neon-cyan/30 selection:text-white overflow-hidden">
      {}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_50%)]"
        />
      </div>

      {}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-premium-violet flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">LYNQ</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#protocol" className="hover:text-white transition-colors">Protocol</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="hidden sm:flex border-white/10"
            onClick={() => setShowWalletModal(true)}
          >
            Connect Wallet
          </Button>
        </div>
      </nav>

      {}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 px-6 z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 px-4 py-1.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-bold tracking-[0.2em] uppercase"
          >
            Liquid Confidence 1.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight mb-8"
          >
            Decentralized Lending.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-premium-violet">
              Institutional Intelligence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 leading-relaxed"
          >
            Borrow with the confidence of a hedge fund. Driven by real-time ML risk assessment,
            explainable credit scores, and radical transparency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mb-20"
          >
            <Button size="lg" className="w-full sm:w-auto px-10 h-14 text-base font-bold bg-white text-black hover:bg-gray-200" onClick={() => setShowWalletModal(true)}>
              Enter Command Center
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-10 h-14 text-base font-bold border-white/10 backdrop-blur-xl">
                View Live Markets
              </Button>
            </Link>
          </motion.div>

          {}
          <div className="w-full max-w-4xl pt-10 border-t border-white/5 flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            {['ETHEREUM', 'POLYGON', 'APTOS', 'FLOW', 'MANTLE'].map((chain) => (
              <span key={chain} className="font-metrics text-xs tracking-[0.3em] font-bold">{chain}</span>
            ))}
          </div>
        </div>
      </motion.section>

      {}
      <section className="relative py-32 px-6 z-10 overflow-hidden" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-premium-violet/10 text-premium-violet border border-premium-violet/20 font-bold text-[10px] tracking-widest uppercase">
                <Brain className="w-3 h-3" />
                ML Intelligence Preview
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-semibold tracking-tight">
                No black boxes.<br />
                Just pure clarity.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Every ML output is explainable. We break down the factors influencing your
                rates so you're always in control of your financial destiny.
              </p>

              <div className="space-y-6 pt-4">
                {[
                  { icon: Shield, title: "Fraud Shield", desc: "Real-time anomaly detection for every transaction." },
                  { icon: Activity, title: "Risk Monitor", desc: "24/7 monitoring of market volatility and health." },
                  { icon: Lock, title: "Asset Protection", desc: "Non-custodial infrastructure. Your keys, your assets." }
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <item.icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <FloatingElement delay={0} yOffset={15}>
                  <div className="p-6 rounded-2xl bg-[#0F1115] border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-metrics text-gray-500 tracking-widest uppercase">Credit Grade</span>
                      <div className="px-2 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold border border-neon-cyan/20 uppercase">Tier A+</div>
                    </div>
                    <div className="flex justify-center my-8">
                      <ConfidenceRing value={98} size={140} />
                    </div>
                    <div className="space-y-4">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[98%] bg-neon-cyan" />
                      </div>
                      <p className="text-[10px] text-gray-500 font-metrics tracking-wider leading-relaxed">
                        HIGH MODEL AGREEMENT: ENSEMBLE CONFIDENCE AT 98.4%
                      </p>
                    </div>
                  </div>
                </FloatingElement>

                <div className="space-y-6">
                  <FloatingElement delay={1} yOffset={15}>
                    <div className="p-6 rounded-2xl bg-[#0F1115] border border-white/10 shadow-2xl backdrop-blur-xl">
                      <span className="block text-[10px] font-metrics text-gray-500 tracking-widest uppercase mb-4">Risk Level</span>
                      <RiskMeter level={12} label="Health Ratio Monitor" />
                    </div>
                  </FloatingElement>

                  <FloatingElement delay={2} yOffset={15}>
                    <div className="p-6 rounded-2xl bg-[#0F1115] border border-white/10 shadow-2xl backdrop-blur-xl">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-metrics text-gray-500 tracking-widest uppercase">Fraud Shield</span>
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Scan Status</span>
                          <span className="text-neon-cyan font-bold font-metrics uppercase">SECURE</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Anomalies Detected</span>
                          <span className="text-white font-bold font-metrics uppercase">0</span>
                        </div>
                      </div>
                    </div>
                  </FloatingElement>
                </div>
              </div>

              {}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-cyan/5 blur-[120px] rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative py-24 px-6 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Shield, title: "Non-Custodial", desc: "Funds never leave your wallet, ensuring total asset control." },
              { icon: Lock, title: "Verified Contracts", desc: "Rigorous audits and multi-chain verification for maximum safety." },
              { icon: Zap, title: "Instant Settlements", desc: "Zero-latency settlements powered by institutional-grade infra." },
              { icon: Brain, title: "Predictive Guard", desc: "Anticipate liquidations before they happen with ML forecasts." }
            ].map((feature, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <feature.icon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <footer className="py-12 border-t border-white/5 text-center text-gray-600 text-[10px] tracking-[0.2em] uppercase font-metrics">
        © 2025 LYNQ PROTOCOL 
      </footer>

      {}
      {showWalletModal && (
        <Suspense fallback={null}>
          <WalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onWalletConnect={(data) => {
              console.log(data);
              setShowWalletModal(false);
            }}
            isLandingPage={true}
          />
        </Suspense>
      )}
    </div>
  );
};

export default LandingPage;
