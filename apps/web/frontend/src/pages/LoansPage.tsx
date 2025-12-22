import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Search,
  CreditCard,
  Wallet,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { contractService } from '../services/contractService';
import { useWalletStore } from '../store/walletStore';

type LoanStatus = 'active' | 'pending' | 'repaid' | 'defaulted';

interface Loan {
  id: string;
  amount: string;
  collateral: string;
  collateralAmount: string;
  healthFactor: number;
  interestRate: number;
  dueDate: string;
  status: LoanStatus;
  createdAt: string;
  outstandingAmount: string;
  chain: string;
}

const statusConfig: Record<LoanStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-warning', bgColor: 'bg-warning/10', icon: Clock },
  repaid: { label: 'Repaid', color: 'text-info', bgColor: 'bg-info/10', icon: CheckCircle },
  defaulted: { label: 'Defaulted', color: 'text-error', bgColor: 'bg-error/10', icon: AlertTriangle },
};

// Loan Card Component
const LoanCard: React.FC<{ loan: Loan; index: number }> = ({ loan, index }) => {
  const status = statusConfig[loan.status];
  const StatusIcon = status.icon;

  const getHealthColor = (health: number) => {
    if (health >= 1.5) return 'text-success';
    if (health >= 1.2) return 'text-warning';
    return 'text-error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/loans/${loan.id}`}>
        <GlassCard interactive>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-primary">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">{loan.amount}</p>
                <p className="text-xs text-gray-500">#{loan.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bgColor}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Collateral</p>
              <p className="text-sm font-medium text-white">{loan.collateralAmount} {loan.collateral}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Health Factor</p>
              <p className={`text-sm font-semibold ${getHealthColor(loan.healthFactor)}`}>
                {loan.healthFactor.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
              <p className="text-sm font-medium text-white">{loan.interestRate}% APR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Due Date</p>
              <p className="text-sm font-medium text-white">{loan.dueDate}</p>
            </div>
          </div>

          {/* Outstanding Amount */}
          {loan.status === 'active' && (
            <div className="pt-4 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Outstanding</p>
                  <p className="text-lg font-bold text-white">{loan.outstandingAmount}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neon-cyan font-medium">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </Link>
    </motion.div>
  );
};

// Stats Overview
const LoansStats: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalBorrowed = activeLoans.reduce((sum, l) => sum + parseFloat(l.amount.replace(/[$,]/g, '')), 0);
  const totalCollateral = activeLoans.reduce((sum, l) => sum + parseFloat(l.collateralAmount), 0);

  const stats = [
    { label: 'Active Loans', value: activeLoans.length.toString(), icon: CreditCard, color: 'neon-cyan' },
    { label: 'Total Borrowed', value: `$${totalBorrowed.toLocaleString()}`, icon: DollarSign, color: 'electric-blue' },
    { label: 'Total Collateral', value: `${totalCollateral} ETH`, icon: Wallet, color: 'deep-purple' },
    { label: 'Avg Health Factor', value: (activeLoans.reduce((sum, l) => sum + l.healthFactor, 0) / (activeLoans.length || 1)).toFixed(2), icon: TrendingUp, color: 'aurora-green' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white font-heading">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

// Main Loans Page
const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | LoanStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const { address } = useWalletStore();
  const [loans, setLoans] = useState<Loan[]>([]);

  React.useEffect(() => {
    const fetchUserLoans = async () => {
      if (address) {
        try {
          const fetched = await contractService.getUserLoans(address);
          const mapped: Loan[] = fetched.map((l: any) => ({
            id: l.id,
            amount: `$${parseFloat(l.amount).toFixed(2)}`,
            collateral: 'MNT', // Mock -> MNT
            collateralAmount: parseFloat(l.collateral).toFixed(2),
            healthFactor: 1.85, // Mock HF
            interestRate: l.interestRate,
            dueDate: l.dueDate === 'Invalid Date' ? 'No Due Date' : l.dueDate,
            status: l.status as LoanStatus,
            createdAt: '2025-01-01', // Mock date
            outstandingAmount: `$${parseFloat(l.amount).toFixed(2)}`, // Simplified
            chain: 'mantle',
          }));
          setLoans(mapped);
        } catch (e) {
          console.error("Error fetching loans:", e);
        }
      }
    };
    fetchUserLoans();
  }, [address]);

  // Mock data preserved if needed for testing, but overwritten by state above initially empty
  /* 
  const loans: Loan[] = [...]
  */

  const filteredLoans = loans.filter(loan => {
    if (filter !== 'all' && loan.status !== filter) return false;
    if (searchTerm && !loan.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-lynq-dark">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold font-heading text-white">Loans</h1>
            <p className="text-gray-400 mt-1">Manage your active and past loans</p>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/loans/new')}
          >
            New Loan Request
          </Button>
        </motion.div>

        {/* Stats */}
        <LoansStats loans={loans} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-11"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'pending', 'repaid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filter === status
                    ? 'bg-glass-strong text-white border border-neon-cyan/30'
                    : 'bg-glass-white text-gray-400 hover:text-white border border-transparent'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredLoans.map((loan, index) => (
              <LoanCard key={loan.id} loan={loan} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredLoans.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-glass-white flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No loans found</h3>
            <p className="text-gray-400 mb-6">
              {filter !== 'all'
                ? `You don't have any ${filter} loans`
                : 'Start by creating your first loan request'
              }
            </p>
            <Button onClick={() => navigate('/loans/new')}>
              Create Loan Request
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoansPage;
