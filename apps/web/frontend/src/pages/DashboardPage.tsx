import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Shield,
  Brain,
  Zap,
  ChevronRight,
  Info,
  Activity,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { contractService } from '../services/contractService';
import { userApi } from '../services/api/users';
import { mlApi } from '../services/api/ml';
import { MetricCard } from '../components/lynq/MetricCard';
import { RiskMeter } from '../components/lynq/RiskMeter';
import { ConfidenceRing } from '../components/lynq/ConfidenceRing';
import { StatusChip } from '../components/lynq/StatusChip';
import { Button } from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { address } = useWalletStore();
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      try {
        const [_, __, loans] = await Promise.all([
          userApi.getProfile(),
          mlApi.getMyCreditScore(),
          contractService.getUserLoans(address)
        ]);

        const active = loans
          .filter((l: any) => l.status === 'active' || l.status === 'pending')
          .slice(0, 3);
        setActiveLoans(active);
      } catch (e) {
        console.error("Dashboard data fetch failed", e);
      }
    };
    fetchData();
  }, [address]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-[10px] font-metrics tracking-[0.2em] text-gray-500 uppercase">System: Operational</span>
            </div>
            <h1 className="text-4xl font-heading font-bold tracking-tight">Mission Control</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-[10px] font-metrics text-gray-500 uppercase tracking-widest">Network Health</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">99.9% Efficiency</span>
            </div>
            <Link to="/loans/new">
              <Button icon={<Plus className="w-5 h-5" />}>Initiate Loan</Button>
            </Link>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-12 gap-6"
        >
          {}
          <motion.div variants={item} className="lg:col-span-3">
            <MetricCard
              label="Net Position"
              value="+$16,470"
              subValue="Liquidity + Collateral"
              trend={{ value: 22.8, isPositive: true }}
              icon={TrendingUp}
            />
          </motion.div>
          <motion.div variants={item} className="lg:col-span-3">
            <MetricCard
              label="Total Borrowed"
              value="$12,450"
              subValue="USDC / USDT / DAI"
              trend={{ value: 8.2, isPositive: false }}
              icon={TrendingDown}
            />
          </motion.div>
          <motion.div variants={item} className="lg:col-span-3">
            <MetricCard
              label="Active Collateral"
              value="$28,920"
              subValue="ETH / BTC / LYNQ"
              trend={{ value: 15.4, isPositive: true }}
              icon={Zap}
            />
          </motion.div>
          <motion.div variants={item} className="lg:col-span-3">
            <MetricCard
              label="Credit Power"
              value="$41,200"
              subValue="Max Borrowing Limit"
              icon={Shield}
            />
          </motion.div>

          {}
          <motion.div variants={item} className="lg:col-span-4 h-full">
            <div className="h-full p-8 rounded-2xl bg-[#0F1115] border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-lg font-bold font-heading">Protocol Safety</h3>
                  <StatusChip status="active" label="Protected" />
                </div>
                <div className="space-y-10">
                  <RiskMeter level={24} label="Liquidation Risk" />
                  <RiskMeter level={15} label="Volatility Exposure" />
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-3">
                <Info className="w-4 h-4 text-neon-cyan" />
                <p className="text-xs text-gray-500 leading-relaxed font-metrics uppercase tracking-wider">
                  Risk Assessment Engine: v2.4.1 [Stable]
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="lg:col-span-4">
            <div className="p-8 rounded-2xl bg-[#0F1115] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold font-heading">ML Confidence</h3>
                  <Brain className="w-5 h-5 text-premium-violet" />
                </div>
                <div className="flex items-center gap-10">
                  <ConfidenceRing value={96} size={130} />
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</span>
                      <span className="text-sm font-bold text-white uppercase font-metrics italic">High Precision</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-metrics leading-relaxed italic border-l-2 border-premium-violet pl-3 py-1">
                        The ensemble model confirms stable behavior patterns with 96% confidence. Your risk premium is currently optimized.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-premium-violet/5 blur-[60px] rounded-full group-hover:bg-premium-violet/10 transition-all duration-700" />
            </div>
          </motion.div>

          <motion.div variants={item} className="lg:col-span-4">
            <div className="p-8 h-full rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-metrics tracking-[0.2em] text-neon-cyan uppercase font-bold mb-4 block">Reputation Grade</span>
                <h3 className="text-5xl font-heading font-black tracking-tighter mb-4 italic">TIER A+</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  You have unlocked **Priority Liquidity** and **0% Fees** on recursive borrows.
                </p>
              </div>
              <Button variant="secondary" className="w-full bg-white/5 border-white/10 hover:bg-white/10 font-metrics tracking-widest text-[10px] uppercase">
                Explore Perks <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>

          {}
          <motion.div variants={item} className="lg:col-span-12 mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-heading">Active Command Positions</h3>
              <Link to="/loans" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                ALL OPERATIONS <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeLoans.length > 0 ? activeLoans.map((loan, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[#0F1115] border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-gray-400 group-hover:border-neon-cyan/20 group-hover:text-neon-cyan transition-all">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white font-metrics uppercase">{loan.amount} USDC</span>
                        <span className="text-[10px] text-gray-500 font-metrics uppercase tracking-wider">Mantle Protocol</span>
                      </div>
                    </div>
                    <StatusChip status="active" label="Stabilized" />
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Health Factor</span>
                      <span className="text-sm font-bold text-neon-cyan font-metrics">1.85 HF</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">APR Rate</span>
                      <span className="text-sm font-bold text-white font-metrics">4.2%</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 text-[10px] font-metrics tracking-widest uppercase py-2">Repay</Button>
                    <Button size="sm" variant="secondary" className="flex-1 text-[10px] font-metrics tracking-widest uppercase py-2">Boost</Button>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-2 lg:col-span-3 p-12 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-gray-700" />
                  </div>
                  <p className="text-gray-500 font-metrics uppercase tracking-[0.2em] text-xs">No active operations detected</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
