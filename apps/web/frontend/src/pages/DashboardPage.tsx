import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  ChevronRight,
  CreditCard,
  Activity,
  Target,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { CreditScoreDisplay, TierProgress } from '../components/ml/CreditScore';
import { MLInsightCard, RiskAlert } from '../components/ml/MLInsights';

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string;
  change?: number;
  icon: typeof Wallet;
  delay?: number;
}> = ({ label, value, change, icon: Icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <GlassCard className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-2">{value}</p>
          {change !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-success' : 'text-error'}`}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change >= 0 ? '+' : ''}{change}%</span>
              <span className="text-gray-500 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-glass-white">
          <Icon className="w-6 h-6 text-neon-cyan" />
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

// Active Loan Card
const ActiveLoanCard: React.FC<{
  loan: {
    id: string;
    amount: string;
    collateral: string;
    healthFactor: number;
    dueDate: string;
    interestRate: number;
  };
  delay?: number;
}> = ({ loan, delay = 0 }) => {
  const getHealthColor = (health: number) => {
    if (health >= 1.5) return 'text-success';
    if (health >= 1.2) return 'text-warning';
    return 'text-error';
  };

  const getHealthBg = (health: number) => {
    if (health >= 1.5) return 'bg-success/10';
    if (health >= 1.2) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <GlassCard interactive className="group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{loan.amount}</p>
              <p className="text-xs text-gray-500">Active Loan</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${getHealthBg(loan.healthFactor)}`}>
            <span className={`text-sm font-semibold ${getHealthColor(loan.healthFactor)}`}>
              {loan.healthFactor.toFixed(2)} HF
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Collateral</p>
            <p className="font-medium text-white">{loan.collateral}</p>
          </div>
          <div>
            <p className="text-gray-500">Interest</p>
            <p className="font-medium text-white">{loan.interestRate}% APR</p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p className="font-medium text-white">{loan.dueDate}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-glass-border flex items-center justify-between">
          <Link to={`/loans/${loan.id}`} className="text-sm text-neon-cyan font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            View Details
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Button size="sm" variant="secondary">
            Repay
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

// Recent Activity Item
const ActivityItem: React.FC<{
  type: 'borrow' | 'repay' | 'deposit' | 'withdraw';
  amount: string;
  asset: string;
  time: string;
  txHash: string;
}> = ({ type, amount, asset, time, txHash }) => {
  const config = {
    borrow: { icon: ArrowUpRight, color: 'text-electric-blue', label: 'Borrowed' },
    repay: { icon: ArrowDownRight, color: 'text-success', label: 'Repaid' },
    deposit: { icon: Plus, color: 'text-neon-cyan', label: 'Deposited' },
    withdraw: { icon: ArrowUpRight, color: 'text-warning', label: 'Withdrew' },
  };

  const { icon: Icon, color, label } = config[type];

  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`p-2 rounded-lg bg-glass-white`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {label} {amount} {asset}
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <a
        href={`https://explorer.mantle.xyz/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-neon-cyan transition-colors"
      >
        View →
      </a>
    </div>
  );
};

// Main Dashboard Component
const DashboardPage: React.FC = () => {
  // Mock data - would come from API in production
  const creditScore = 742;
  const previousScore = 718;
  const tier = 'gold' as const;

  const stats = [
    { label: 'Total Borrowed', value: '$12,450', change: 8.2, icon: CreditCard },
    { label: 'Total Collateral', value: '$28,920', change: 15.4, icon: Wallet },
    { label: 'Available Credit', value: '$41,200', change: 12.1, icon: Target },
    { label: 'Net Position', value: '+$16,470', change: 22.8, icon: Activity },
  ];

  const activeLoans = [
    {
      id: '1',
      amount: '$5,000 USDC',
      collateral: '2.5 ETH',
      healthFactor: 1.85,
      dueDate: 'Jan 15, 2025',
      interestRate: 7.5,
    },
    {
      id: '2',
      amount: '$7,450 USDC',
      collateral: '180 MNT',
      healthFactor: 1.42,
      dueDate: 'Feb 1, 2025',
      interestRate: 8.2,
    },
  ];

  const recentActivity = [
    { type: 'borrow' as const, amount: '5,000', asset: 'USDC', time: '2 hours ago', txHash: '0x123' },
    { type: 'deposit' as const, amount: '2.5', asset: 'ETH', time: '2 hours ago', txHash: '0x124' },
    { type: 'repay' as const, amount: '1,200', asset: 'USDC', time: '1 day ago', txHash: '0x125' },
  ];

  const mlInsight = {
    title: 'Credit Assessment',
    insight: 'Your credit score has improved significantly due to consistent repayment behavior and increased collateral diversity.',
    confidence: 94.7,
    factors: [
      { name: 'Repayment History', impact: 'positive' as const, weight: 0.35 },
      { name: 'Collateral Diversity', impact: 'positive' as const, weight: 0.25 },
      { name: 'Protocol Activity', impact: 'positive' as const, weight: 0.20 },
      { name: 'Wallet Age', impact: 'neutral' as const, weight: 0.12 },
    ],
    recommendation: 'Consider diversifying into additional protocols to further improve your score.',
    modelAgreement: 92,
  };

  return (
    <div className="min-h-screen bg-lynq-dark">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold font-heading text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back! Here's your DeFi overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-glass-white backdrop-blur-md border border-glass-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-gray-300">Mantle Mainnet</span>
              </div>
            </div>
            <Link to="/loans/new">
              <Button icon={<Plus className="w-4 h-4" />}>New Loan</Button>
            </Link>
          </div>
        </motion.div>

        {/* Risk Alert - Show if health factor is low */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <RiskAlert
            level="medium"
            title="Health Factor Warning"
            message="One of your positions has a health factor below 1.5. Consider adding collateral to avoid liquidation."
            actionLabel="Add Collateral"
            onAction={() => { }}
          />
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Loans */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <StatCard key={stat.label} {...stat} delay={0.1 + index * 0.05} />
              ))}
            </div>

            {/* Active Loans */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neon-cyan" />
                  Active Loans
                </h2>
                <Link to="/loans" className="text-sm text-gray-400 hover:text-white transition-colors">
                  View All →
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {activeLoans.map((loan, index) => (
                  <ActiveLoanCard key={loan.id} loan={loan} delay={0.4 + index * 0.1} />
                ))}
              </div>
            </motion.div>

            {/* ML Insights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-deep-purple" />
                <h2 className="text-xl font-semibold text-white">AI Insights</h2>
              </div>
              <MLInsightCard {...mlInsight} />
            </motion.div>
          </div>

          {/* Right Column - Credit Score & Activity */}
          <div className="space-y-8">
            {/* Credit Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Credit Score</h2>
                  <Link to="/analytics" className="text-xs text-gray-400 hover:text-white transition-colors">
                    Details →
                  </Link>
                </div>
                <div className="flex justify-center mb-6">
                  <CreditScoreDisplay
                    score={creditScore}
                    previousScore={previousScore}
                    tier={tier}
                  />
                </div>
                <div className="mt-6">
                  <TierProgress currentTier={tier} currentScore={creditScore} />
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <span className="text-xs text-gray-500">Last 7 days</span>
                </div>
                <div className="divide-y divide-glass-border">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <Link
                    to="/history"
                    className="block text-center text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    View Full History
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
