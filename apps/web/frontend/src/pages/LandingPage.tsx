import React, { useState, Suspense, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Brain,
  Globe,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Lock,
  BarChart3,
  Wallet,
  CheckCircle2,
  Award,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

// Lazy load wallet modal
const WalletConnectionModal = React.lazy(() => import('../components/wallet/WalletConnectionModal'));

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; prefix?: string; duration?: number }> = ({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

// Floating Orb Component
const FloatingOrb: React.FC<{ size: number; color: string; delay: number; x: string; y: string }> = ({
  size, color, delay, x, y
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
      x: [0, 30, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
    }}
    className="absolute rounded-full blur-3xl pointer-events-none"
    style={{
      width: size,
      height: size,
      background: color,
      left: x,
      top: y,
    }}
  />
);

// Feature Card
const FeatureCard: React.FC<{
  icon: typeof Zap;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}> = ({ icon: Icon, title, description, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
  >
    <GlassCard interactive className="h-full group">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </GlassCard>
  </motion.div>
);

// Chain Logo Component
const ChainLogo: React.FC<{ name: string; delay: number }> = ({ name, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="flex flex-col items-center gap-2"
  >
    <div className="w-16 h-16 rounded-2xl bg-glass-white border border-glass-border flex items-center justify-center hover:border-neon-cyan/30 transition-colors">
      <Globe className="w-8 h-8 text-gray-300" />
    </div>
    <span className="text-xs text-gray-500">{name}</span>
  </motion.div>
);

const LandingPage: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: Brain,
      title: 'AI Risk Intelligence',
      description: 'Advanced machine learning models analyze wallet behavior, transaction patterns, and on-chain data to provide accurate risk assessments.',
      gradient: 'from-deep-purple to-electric-blue',
    },
    {
      icon: Shield,
      title: 'Explainable Credit Scoring',
      description: 'No black boxes. Every credit decision comes with transparent explanations of the factors that influenced your score.',
      gradient: 'from-neon-cyan to-success',
    },
    {
      icon: Zap,
      title: 'Instant Flash Loans',
      description: 'Execute complex DeFi strategies with uncollateralized flash loans. Borrow and repay within a single transaction block.',
      gradient: 'from-warning to-tier-gold',
    },
    {
      icon: Globe,
      title: 'Multi-Chain Support',
      description: 'Deploy across Mantle, Ethereum, Polygon, and more. Unified experience across all major EVM-compatible chains.',
      gradient: 'from-electric-blue to-neon-cyan',
    },
    {
      icon: Lock,
      title: 'Smart Liquidation Protection',
      description: 'AI-powered monitoring detects risks before liquidation. Automatic alerts and one-click collateral management.',
      gradient: 'from-error to-warning',
    },
    {
      icon: Award,
      title: 'Reputation System',
      description: 'Build your on-chain credit history. Higher tiers unlock better rates, higher limits, and exclusive features.',
      gradient: 'from-tier-gold to-tier-diamond',
    },
  ];

  const stats = [
    { label: 'Total Value Locked', value: 47.2, suffix: 'M', prefix: '$' },
    { label: 'Active Users', value: 12847, suffix: '+', prefix: '' },
    { label: 'Loans Processed', value: 89000, suffix: '+', prefix: '' },
    { label: 'Default Rate', value: 0.3, suffix: '%', prefix: '' },
  ];

  const chains = ['Mantle', 'Ethereum', 'Polygon', 'Arbitrum', 'Base'];

  const handleWalletConnect = (walletData: any) => {
    console.log('Wallet connected:', walletData);
    setShowWalletModal(false);
  };

  return (
    <div className="min-h-screen bg-lynq-dark overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />

        {/* Animated Orbs */}
        <FloatingOrb size={600} color="rgba(41, 121, 255, 0.15)" delay={0} x="10%" y="20%" />
        <FloatingOrb size={500} color="rgba(0, 229, 255, 0.12)" delay={2} x="60%" y="10%" />
        <FloatingOrb size={400} color="rgba(101, 31, 255, 0.15)" delay={4} x="80%" y="60%" />
        <FloatingOrb size={450} color="rgba(0, 229, 255, 0.1)" delay={3} x="20%" y="70%" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-6"
      >
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass-white backdrop-blur-md border border-glass-border mb-8"
          >
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-gray-300">AI-Powered DeFi Protocol</span>
            <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs font-bold">LIVE</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold font-heading tracking-tight mb-6"
          >
            <span className="text-white">The Future of</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-blue via-neon-cyan to-deep-purple">
              DeFi Lending
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Explainable AI credit scoring, dynamic interest rates, and multi-chain
            liquidity—all in one seamless protocol.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              size="lg"
              glow
              icon={<Wallet className="w-5 h-5" />}
              onClick={() => setShowWalletModal(true)}
            >
              Connect Wallet
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" icon={<ArrowRight className="w-5 h-5" />}>
                Launch App
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-glass-white/30 backdrop-blur-md border border-glass-border/50"
              >
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={2 + index * 0.3} />
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-2 bg-neon-cyan rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trusted By / Chains Section */}
      <section className="relative py-20 border-y border-glass-border/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-500 text-sm uppercase tracking-widest mb-10"
          >
            Multi-Chain Support Across Leading Networks
          </motion.p>
          <div className="flex justify-center items-center gap-10 flex-wrap">
            {chains.map((chain, index) => (
              <ChainLogo key={chain} name={chain} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-deep-purple/20 text-deep-purple text-sm font-semibold mb-4">
              CORE FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4">
              Built for the Future of Finance
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade infrastructure meets accessible DeFi.
              Every feature designed with security and transparency in mind.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Explainability Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-sm font-semibold mb-4">
                NO BLACK BOX AI
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
                Transparent Credit Decisions
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Our ML models don't just give you a score—they explain why.
                See exactly which factors influence your creditworthiness with
                intuitive visualizations and actionable insights.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Brain, text: 'Multi-model ensemble for accuracy' },
                  { icon: BarChart3, text: 'Factor attribution visualization' },
                  { icon: CheckCircle2, text: 'Real-time score updates' },
                  { icon: Activity, text: 'Personalized improvement tips' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-glass-white">
                      <Icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <span className="text-gray-300">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-deep-purple/20 rounded-3xl blur-3xl" />

              <div className="relative bg-lynq-card/80 backdrop-blur-xl rounded-3xl border border-glass-border p-8">
                {/* Mock Credit Score UI */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-48 h-48 rounded-full border-8 border-neon-cyan/30 relative">
                    <div className="text-6xl font-bold text-white">742</div>
                    <div className="absolute inset-0 rounded-full border-8 border-neon-cyan" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 74%, 50% 74%)' }} />
                  </div>
                  <p className="text-gray-400 mt-4">Your LYNQ Score</p>
                </div>

                {/* Factors */}
                <div className="space-y-4">
                  {[
                    { factor: 'Repayment History', value: 95, color: 'bg-success' },
                    { factor: 'Collateral Diversity', value: 78, color: 'bg-neon-cyan' },
                    { factor: 'Protocol Activity', value: 62, color: 'bg-electric-blue' },
                    { factor: 'Wallet Age', value: 85, color: 'bg-deep-purple' },
                  ].map(({ factor, value, color }) => (
                    <div key={factor}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{factor}</span>
                        <span className="text-white font-medium">{value}%</span>
                      </div>
                      <div className="h-2 bg-lynq-darker rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full ${color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Model Agreement */}
                <div className="mt-8 p-4 rounded-xl bg-lynq-darker/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-neon-cyan" />
                    <span className="text-gray-400 text-sm">Model Agreement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">92%</span>
                    <div className="w-3 h-3 rounded-full bg-success" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-electric-blue/20 via-neon-cyan/20 to-deep-purple/20 rounded-3xl blur-2xl" />

            <div className="relative bg-lynq-card/80 backdrop-blur-xl rounded-3xl border border-glass-border p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
                Ready to Start?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Connect your wallet and experience the next generation of DeFi lending.
                No minimum deposits, no hidden fees.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  glow
                  icon={<Wallet className="w-5 h-5" />}
                  onClick={() => setShowWalletModal(true)}
                >
                  Connect Wallet
                </Button>
                <Link to="/docs">
                  <Button size="lg" variant="ghost">
                    Read Documentation <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-glass-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">LYNQ</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>

            <p className="text-sm text-gray-500">
              &copy; 2024 LYNQ Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Wallet Modal */}
      {showWalletModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="loading-spinner w-12 h-12" />
          </div>
        }>
          <WalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onWalletConnect={handleWalletConnect}
            isLandingPage={true}
          />
        </Suspense>
      )}
    </div>
  );
};

export default LandingPage;
