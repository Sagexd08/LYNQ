import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle,
  Coins,
  Clock,
  Activity,
  HelpCircle,
  BarChart3,
  ChevronRight,
  Plus,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfidenceRing } from '../components/lynq/ConfidenceRing';

const FlashLoanPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<null | {
    success: boolean;
    estimatedGas: string;
    premium: string;
    risks: string[];
  }>(null);

  const assets = [
    { symbol: 'USDC', available: '2,450,000', apy: '0.05%', icon: '💵' },
    { symbol: 'ETH', available: '1,250', apy: '0.05%', icon: '⟠' },
    { symbol: 'MNT', available: '5,000,000', apy: '0.05%', icon: '🔷' },
    { symbol: 'USDT', available: '1,890,000', apy: '0.05%', icon: '💲' },
  ];

  const handleSimulate = async () => {
    setIsSimulating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSimulationResult({
      success: true,
      estimatedGas: '0.0045 ETH',
      premium: `${(parseFloat(amount.replace(/,/g, '') || '0') * 0.0005).toFixed(2)} ${selectedAsset}`,
      risks: amount && parseFloat(amount.replace(/,/g, '')) > 500000
        ? ['Large amount may have slippage impact']
        : [],
    });
    setIsSimulating(false);
  };

  const container = {
    show: { transition: { staggerChildren: 0.1 } }
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
              <Zap className="w-5 h-5 text-neon-cyan animate-pulse" />
              <span className="text-[10px] font-metrics tracking-[0.2em] text-gray-500 uppercase font-bold">Protocol: Atomic Liquidity</span>
            </div>
            <h1 className="text-4xl font-heading font-bold tracking-tight">Flash Operations</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-metrics">System Load</span>
              <span className="text-xs font-bold text-neon-cyan uppercase font-metrics">OPTIMIZED</span>
            </div>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-12 gap-8"
        >
          {}
          <motion.div variants={item} className="lg:col-span-8 space-y-8">
            {}
            <div className="p-8 rounded-3xl bg-[#0F1115] border border-white/5">
              <h2 className="text-sm font-bold font-metrics uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Coins className="w-4 h-4" /> 01. Select Payload
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {assets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    className={`p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${selectedAsset === asset.symbol
                      ? 'bg-white border-white text-black'
                      : 'bg-[#050505] border-white/5 text-white hover:border-white/20'
                      }`}
                  >
                    <span className={`block text-lg font-bold font-metrics mb-1 ${selectedAsset === asset.symbol ? 'text-black' : 'text-white'}`}>{asset.symbol}</span>
                    <span className={`block text-[10px] font-metrics uppercase tracking-wider ${selectedAsset === asset.symbol ? 'text-black/60' : 'text-gray-500'}`}>
                      {asset.available} Avail.
                    </span>
                    {selectedAsset === asset.symbol && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="p-8 rounded-3xl bg-[#0F1115] border border-white/5">
              <h2 className="text-sm font-bold font-metrics uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Plus className="w-4 h-4" /> 02. Quantum Amount
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl px-8 py-6 text-4xl font-heading font-black italic focus:border-neon-cyan/50 outline-none transition-all placeholder:text-gray-800"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <span className="text-xl font-black font-metrics text-gray-600 uppercase italic">{selectedAsset}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {['25%', '50%', '75%', 'MAX'].map(p => (
                  <button key={p} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-metrics font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className={`p-8 rounded-3xl border transition-all duration-500 ${simulationResult ? 'bg-neon-cyan/5 border-neon-cyan/20' : 'bg-[#0F1115] border-white/5 shadow-inner'
              }`}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-sm font-bold font-metrics uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 03. Execution Matrix
                </h2>
                {simulationResult && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan text-black font-metrics text-[10px] font-black uppercase italic">
                    <CheckCircle className="w-3 h-3" /> Target Acquired
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {simulationResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-10"
                  >
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Fee Premium</span>
                      <span className="text-xl font-bold font-metrics text-white">{simulationResult.premium}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Fuel Estimate</span>
                      <span className="text-xl font-bold font-metrics text-white">{simulationResult.estimatedGas}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Protocol Fee</span>
                      <span className="text-xl font-bold font-metrics text-neon-cyan">0.05%</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-10 text-center flex flex-col items-center gap-4">
                    <BarChart3 className="w-12 h-12 text-gray-800" />
                    <p className="text-xs text-gray-600 font-metrics uppercase tracking-widest italic">Run simulation to verify transaction atomicity</p>
                  </div>
                )}
              </AnimatePresence>

              <div className="mt-10 pt-10 border-t border-white/5 flex flex-col md:flex-row gap-4">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleSimulate}
                  loading={isSimulating}
                  className="bg-white/5 border-white/10 font-metrics tracking-widest text-[11px] uppercase py-4"
                >
                  Simulate payload
                </Button>
                <Button
                  fullWidth
                  disabled={!simulationResult}
                  className="bg-neon-cyan text-black font-black tracking-[0.2em] text-[11px] italic uppercase shadow-glow-sm py-4"
                >
                  Fire Transaction
                </Button>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div variants={item} className="lg:col-span-4 space-y-8">
            {}
            <div className="p-8 rounded-3xl bg-[#0F1115] border border-white/5">
              <h3 className="text-sm font-bold font-heading mb-8 flex items-center justify-between">
                USER REPUTATION
                <Shield className="w-4 h-4 text-premium-violet" />
              </h3>
              <div className="flex items-center gap-8 mb-8">
                <ConfidenceRing value={84} size={100} strokeWidth={8} />
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Credit Power</span>
                    <span className="text-xl font-bold font-metrics">847</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-bold font-metrics uppercase inline-block italic">
                    ELITE STATUS
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-8 border-t border-white/5 font-metrics">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">History</span>
                  <span className="text-xs font-bold">12 OPS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Efficiency</span>
                  <span className="text-xs font-bold text-neon-cyan">100%</span>
                </div>
              </div>
            </div>

            {}
            <div className="p-8 rounded-3xl bg-[#0F1115] border border-white/5">
              <h3 className="text-sm font-bold font-heading mb-6 flex items-center justify-between uppercase tracking-widest">
                Recent Operations
                <Clock className="w-4 h-4 text-gray-500" />
              </h3>
              <div className="space-y-4">
                {[
                  { asset: '50K USDC', time: '2h ago', status: 'Stable' },
                  { asset: '120 ETH', time: '1d ago', status: 'Stable' },
                  { asset: '1M MNT', time: '3d ago', status: 'Stable' },
                ].map((op, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#050505] border border-white/5 group hover:border-white/10 transition-all">
                    <div>
                      <span className="block text-xs font-bold font-metrics text-white group-hover:text-neon-cyan transition-colors">{op.asset}</span>
                      <span className="text-[10px] text-gray-600 font-metrics uppercase tracking-wider">{op.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neon-cyan/5 text-neon-cyan text-[8px] font-black uppercase tracking-widest italic border border-neon-cyan/10">
                      {op.status}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 text-center text-[10px] font-metrics font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
                Open Command Logs <ChevronRight className="w-3 h-3 inline ml-1" />
              </button>
            </div>

            {}
            <div className="p-6 rounded-3xl border border-white/5 bg-white/5 flex items-start gap-4">
              <HelpCircle className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2 font-heading">Flash Protocol v1.0</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed font-metrics uppercase tracking-widest">
                  Flash loans are zero-collateral assets that must be repaid within the same atomic transaction.
                  Standard premium is 0.05% of the total payload.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FlashLoanPage;
