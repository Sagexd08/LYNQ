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
import { contractService } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import toast from 'react-hot-toast';
import { loanApi } from '../services/api/loans';
import { userApi } from '../services/api/users';
import { mlApi } from '../services/api/ml';
import { useWalletStore } from '../store/walletStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { CreditScoreDisplay, TierProgress } from '../components/ml/CreditScore';
import { MLInsightCard, RiskAlert } from '../components/ml/MLInsights';
import { RefinanceModal } from '../components/dashboard/RefinanceModal';

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
  loan: any;
  delay?: number;
  onRepay: (id: string, amount: string, assetAddress: string) => void;
  onRefinance: (id: string, rate: number) => void;
}> = ({ loan, delay = 0, onRepay, onRefinance }) => {
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
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-transparent border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => onRefinance(loan.id, loan.interestRate)}
            >
              Refinance
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRepay(loan.id, loan.amount.split(' ')[0], (loan.assetAddress || CONTRACT_ADDRESSES.mantleSepolia.StableToken || '') as string)}
            >
              Repay
            </Button>
          </div>
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
const DashboardPage: React.FC = () => {
  const { address } = useWalletStore();
  const [creditScore, setCreditScore] = React.useState(0);
  const [tier, setTier] = React.useState<any>('bronze');
  const previousScore = 718;

  const [mlData, setMlData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        if (res.data) {
          if (!mlData) {
            setCreditScore(res.data.reputationPoints || 0);
            setTier((res.data.reputationTier || 'BRONZE').toLowerCase());
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    };

    const fetchML = async () => {
      try {
        const res = await mlApi.getMyCreditScore();
        if (res.data) {
          setMlData(res.data);
          setCreditScore(res.data.score);
          const grade = res.data.grade;
          if (grade.startsWith('A')) setTier('platinum');
          else if (grade.startsWith('B')) setTier('gold');
          else if (grade.startsWith('C')) setTier('silver');
          else setTier('bronze');
        }
      } catch (e) {
        console.error("Failed to fetch ML score:", e);
      }
    };

    fetchProfile();
    fetchML();
  }, [address]);

  const stats = [
    { label: 'Total Borrowed', value: '$12,450', change: 8.2, icon: CreditCard },
    { label: 'Total Collateral', value: '$28,920', change: 15.4, icon: Wallet },
    { label: 'Available Credit', value: '$41,200', change: 12.1, icon: Target },
    { label: 'Net Position', value: '+$16,470', change: 22.8, icon: Activity },
  ];

  const [activeLoans, setActiveLoans] = React.useState<any[]>([]);
  const [refinanceModalData, setRefinanceModalData] = React.useState<{ id: string, rate: number } | null>(null);

  React.useEffect(() => {
    const fetchLoans = async () => {
      if (address) {
        try {
          const loans = await contractService.getUserLoans(address!);
          const active = loans
            .filter((l: any) => l.status === 'active' || l.status === 'pending')
            .map((l: any) => ({
              ...l,
              amount: `${parseFloat(l.amount).toFixed(2)} USDC`,
              collateral: `${parseFloat(l.collateral).toFixed(2)} MNT`,
              healthFactor: 1.85,
              dueDate: l.dueDate === 'Invalid Date' ? 'No Due Date' : l.dueDate,
            }));
          setActiveLoans(active);
        } catch (error) {
          // Silent fail or toast
        }
      }
    };
    fetchLoans();
  }, [address]);

  const handleRefinance = async (id: string, rate: number) => {
    try {
      const res = await loanApi.getMyLoans();
      const loans = Array.isArray(res.data) ? res.data : [];
      const matched = loans.find((l: any) => l.metadata?.onChainId === id);

      if (matched) {
        setRefinanceModalData({ id: matched.id, rate });
      } else {
        toast.error("Loan not synced with backend. Cannot refinance yet.");
      }
    } catch (e) {
      console.error("Refinance lookup failed:", e);
      toast.error("Failed to check eligibility");
    }
  };

  const handleRepay = async (id: string, amount: string, assetAddress: string) => {
    try {
      const cleanAmount = amount.replace(/,/g, '').split(' ')[0] || '0';
      const txHash = await contractService.repayLoan(id, cleanAmount, assetAddress);
      try {
        const response = await loanApi.getMyLoans();
        const loans = Array.isArray(response.data) ? response.data : [];
        const matchedLoan = loans.find((l: any) =>
          l.metadata?.onChainId === id
        );

        if (matchedLoan) {
          await loanApi.repay(matchedLoan.id, {
            amount: cleanAmount,
            transactionHash: txHash
          });
        }
      } catch (e) {
        console.error("Backend sync failed for repay:", e);
      }
      if (address) {
        const loans = await contractService.getUserLoans(address!);
        const active = loans
          .filter((l: any) => l.status === 'active' || l.status === 'pending')
          .map((l: any) => ({
            ...l,
            amount: `${parseFloat(l.amount).toFixed(2)} USDC`,
            collateral: `${parseFloat(l.collateral).toFixed(2)} MNT`,
            healthFactor: 1.85,
            dueDate: l.dueDate === 'Invalid Date' ? 'No Due Date' : l.dueDate,
          }));
        setActiveLoans(active);
      }
    } catch (error) {
      console.error("Repayment flow error:", error);
    }
  };

  const recentActivity = [
    { type: 'borrow' as const, amount: '5,000', asset: 'USDC', time: '2 hours ago', txHash: '0x123' },
    { type: 'deposit' as const, amount: '2.5', asset: 'MNT', time: '2 hours ago', txHash: '0x124' },
    { type: 'repay' as const, amount: '1,200', asset: 'USDC', time: '1 day ago', txHash: '0x125' },
  ];

  const mlInsight = mlData ? {
    title: 'AI Credit Assessment',
    insight: `Your credit grade is ${mlData.grade}. This assessment is based on your real-time payment history and utilization.`,
    confidence: 96.5,
    factors: [
      { name: 'Payment History', impact: 'positive' as const, weight: 0.35 },
      { name: 'Utilization', impact: (mlData.breakdown?.utilization > 100 ? 'positive' : 'neutral') as 'positive' | 'neutral' | 'negative', weight: 0.25 },
      { name: 'Account Age', impact: 'positive' as const, weight: 0.15 },
      { name: 'Reputation', impact: 'positive' as const, weight: 0.15 },
    ],
    recommendation: mlData.grade.startsWith('A') ? 'Maintain your excellent habits!' : 'Reduce utilization to improve your score.',
    modelAgreement: 94,
  } : {
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
                  <ActiveLoanCard
                    key={loan.id}
                    loan={loan}
                    delay={0.4 + index * 0.1}
                    onRepay={handleRepay}
                    onRefinance={handleRefinance}
                  />
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

      {refinanceModalData && (
        <RefinanceModal
          isOpen={!!refinanceModalData}
          onClose={() => setRefinanceModalData(null)}
          loanId={refinanceModalData.id}
          currentRate={refinanceModalData.rate}
        />
      )}
    </div>
  );
};

export default DashboardPage;
