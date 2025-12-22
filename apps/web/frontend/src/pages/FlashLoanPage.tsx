import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,

  AlertTriangle,
  CheckCircle,
  Info,
  Coins,
  Clock,
  ArrowRight,
  BarChart3,
  Shield,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ConfidenceIndicator } from '../components/ml/MLInsights';

// Flash Loan Page
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

  // Mock available assets
  const assets = [
    { symbol: 'USDC', available: '2,450,000', apy: '0.09%', icon: '💵' },
    { symbol: 'ETH', available: '1,250', apy: '0.05%', icon: '⟠' },
    { symbol: 'MNT', available: '5,000,000', apy: '0.12%', icon: '🔷' },
    { symbol: 'USDT', available: '1,890,000', apy: '0.09%', icon: '💲' },
  ];

  // Mock user stats  
  const userStats = {
    totalFlashLoans: 12,
    successRate: 100,
    totalVolume: '$458,200',
    trustScore: 847,
    riskLevel: 'Low',
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSimulationResult({
      success: true,
      estimatedGas: '0.0045 ETH',
      premium: `${(parseFloat(amount || '0') * 0.0009).toFixed(2)} ${selectedAsset}`,
      risks: amount && parseFloat(amount.replace(/,/g, '')) > 100000
        ? ['Large amount may have slippage impact']
        : [],
    });
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-lynq-dark">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-glow-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading text-white">Flash Loans</h1>
              <p className="text-gray-400">Uncollateralized instant liquidity for DeFi operations</p>
            </div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="border-l-4 border-l-info">
            <div className="flex items-start gap-4">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">What are Flash Loans?</h3>
                <p className="text-gray-400 text-sm">
                  Flash loans allow you to borrow any amount of assets without collateral, as long as the
                  liquidity is returned to the pool within the same transaction. Perfect for arbitrage,
                  collateral swaps, and liquidations.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-neon-cyan" />
                  Select Asset
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset.symbol)}
                      className={`
                        p-4 rounded-xl border transition-all
                        ${selectedAsset === asset.symbol
                          ? 'bg-glass-strong border-neon-cyan/50 shadow-glow-sm'
                          : 'bg-glass-white border-glass-border hover:border-glass-strong'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{asset.icon}</div>
                      <p className="font-semibold text-white">{asset.symbol}</p>
                      <p className="text-xs text-gray-500">{asset.available} available</p>
                      <p className="text-xs text-success mt-1">{asset.apy} fee</p>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-neon-cyan" />
                  Loan Amount
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Enter amount"
                      className="input-glass text-2xl font-bold pr-20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-gray-400 font-medium">{selectedAsset}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Available Liquidity</span>
                    <span className="text-white font-medium">
                      {assets.find(a => a.symbol === selectedAsset)?.available} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {['25%', '50%', '75%', 'MAX'].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          const available = parseFloat(
                            assets.find(a => a.symbol === selectedAsset)?.available.replace(/,/g, '') || '0'
                          );
                          const percentage = pct === 'MAX' ? 1 : parseFloat(pct) / 100;
                          setAmount((available * percentage).toLocaleString());
                        }}
                        className="flex-1 py-2 rounded-lg bg-glass-white hover:bg-glass-strong text-gray-300 text-sm font-medium transition-colors"
                      >
                        {pct}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Simulation Result */}
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard className={simulationResult.success ? 'border-success/30' : 'border-error/30'}>
                  <div className="flex items-center gap-3 mb-4">
                    {simulationResult.success ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-error" />
                    )}
                    <h3 className="text-lg font-semibold text-white">
                      Simulation {simulationResult.success ? 'Successful' : 'Failed'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Estimated Gas</p>
                      <p className="text-lg font-semibold text-white">{simulationResult.estimatedGas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Premium (Fee)</p>
                      <p className="text-lg font-semibold text-white">{simulationResult.premium}</p>
                    </div>
                  </div>
                  {simulationResult.risks.length > 0 && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning">Warnings</p>
                          {simulationResult.risks.map((risk, i) => (
                            <p key={i} className="text-sm text-gray-300">{risk}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4"
            >
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleSimulate}
                loading={isSimulating}
                icon={<BarChart3 className="w-5 h-5" />}
              >
                Simulate Transaction
              </Button>
              <Button
                size="lg"
                fullWidth
                disabled={!simulationResult?.success}
                icon={<Zap className="w-5 h-5" />}
              >
                Execute Flash Loan
              </Button>
            </motion.div>
          </div>

          {/* Right Sidebar - Stats & Info */}
          <div className="space-y-6">
            {/* User Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-deep-purple" />
                  Your Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Trust Score</span>
                    <span className="text-xl font-bold text-white">{userStats.trustScore}</span>
                  </div>
                  <ConfidenceIndicator
                    confidence={userStats.trustScore / 10}
                    label="Risk Level"
                    size="sm"
                  />
                  <div className="divider" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Loans</p>
                      <p className="text-lg font-bold text-white">{userStats.totalFlashLoans}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-lg font-bold text-success">{userStats.successRate}%</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Total Volume</p>
                      <p className="text-lg font-bold text-white">{userStats.totalVolume}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neon-cyan" />
                  Recent Flash Loans
                </h3>
                <div className="space-y-3">
                  {[
                    { amount: '50,000 USDC', time: '2h ago', success: true },
                    { amount: '120 ETH', time: '1d ago', success: true },
                    { amount: '1,000,000 MNT', time: '3d ago', success: true },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-lynq-darker/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tx.success ? 'bg-success' : 'bg-error'}`} />
                        <span className="text-sm text-white">{tx.amount}</span>
                      </div>
                      <span className="text-xs text-gray-500">{tx.time}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-center text-sm text-gray-400 hover:text-white transition-colors">
                  View All History
                </button>
              </GlassCard>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="border-glass-strong">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Need Help?</h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Learn how to use flash loans effectively and safely.
                    </p>
                    <button className="text-sm text-neon-cyan font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      Read Documentation
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashLoanPage;
