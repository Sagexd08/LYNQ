'use client';

import { motion, useInView } from 'framer-motion';
import { BookOpen, DollarSign, CheckCircle } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/shared/Buttons';

export function ProductIntroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Two Experiences. One Platform.
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Whether you're learning or lending, LYNQ adapts to your journey
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Learning Mode */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="p-10 bg-gradient-to-br from-cyan-500/20 to-blue-400/10 border border-cyan-400/30 rounded-3xl shadow-lg shadow-cyan-500/10"
          >
            <BookOpen className="w-16 h-16 text-cyan-400 mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">Learning Mode</h3>
            <p className="text-white/80 mb-8 text-lg leading-relaxed">
              Master DeFi concepts through interactive lessons, risk-free simulations,
              and real-time feedback. Build confidence before risking a single dollar.
            </p>

            <div className="space-y-4 mb-8">
              {[
                '5 comprehensive lessons covering fundamentals to advanced',
                'Interactive sandbox with simulated transactions',
                'Quizzes with instant feedback and explanations',
                'Earn reputation points as you progress',
                'Track your learning journey and achievements',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <a href="/learning" className="w-full block px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-black font-bold transition text-center shadow-lg shadow-cyan-500/25">
              Start Learning
            </a>
          </motion.div>

          {/* Lending Mode */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="p-10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-400/30 rounded-3xl"
          >
            <DollarSign className="w-16 h-16 text-cyan-400 mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">Lending Mode</h3>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              Access institutional-grade lending with reputation-based rates.
              Your learning journey becomes your credit score.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Reputation-based interest rates and borrowing limits',
                'Multi-chain support (Mantle live, more coming)',
                'Real-time risk monitoring and health factor alerts',
                'Transparent liquidation logic with no surprises',
                'Automated portfolio optimization',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <a href="/app" className="w-full block px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold transition text-center shadow-lg shadow-purple-500/25">
              Launch Platform
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
