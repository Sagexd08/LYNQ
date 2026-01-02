import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  CreditCard,
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Activity,
  Calendar,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { contractService } from '../services/contractService';
import { useWalletStore } from '../store/walletStore';
import { MetricCard } from '../components/lynq/MetricCard';
import { StatusChip } from '../components/lynq/StatusChip';

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

const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWalletStore();
  const [filter, setFilter] = useState<'all' | LoanStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const fetchUserLoans = async () => {
      if (address) {
        try {
          const fetched = await contractService.getUserLoans(address);
          const mapped: Loan[] = fetched.map((l: any) => ({
            id: l.id,
            amount: `${parseFloat(l.amount).toFixed(2)}`,
            collateral: 'MNT',
            collateralAmount: parseFloat(l.collateral).toFixed(2),
            healthFactor: 1.85,
            interestRate: l.interestRate,
            dueDate: l.dueDate === 'Invalid Date' ? 'Expiring Soon' : l.dueDate,
            status: l.status as LoanStatus,
            createdAt: '2025-01-01',
            outstandingAmount: `${parseFloat(l.amount).toFixed(2)}`,
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

  const activeLoansList = loans.filter(l => l.status === 'active');
  const totalBorrowed = activeLoansList.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const totalCollateralValue = activeLoansList.reduce((sum, l) => sum + parseFloat(l.collateralAmount), 0);

  const filteredLoans = loans.filter(loan => {
    if (filter !== 'all' && loan.status !== filter) return false;
    if (searchTerm && !loan.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const container = {
    show: { transition: { staggerChildren: 0.05 } }
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
              <div className="w-2 h-2 rounded-full bg-neon-cyan" />
              <span className="text-[10px] font-metrics tracking-[0.2em] text-gray-500 uppercase">Operational: Portfolio Management</span>
            </div>
            <h1 className="text-4xl font-heading font-bold tracking-tight">Financial Arsenal</h1>
          </div>
          <Link to="/loans/new">
            <Button icon={<Plus className="w-5 h-5" />}>Acquire Capital</Button>
          </Link>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard
            label="Active Operations"
            value={activeLoansList.length.toString()}
            subValue="Running positions"
            icon={Activity}
          />
          <MetricCard
            label="Total Liabilities"
            value={`$${totalBorrowed.toLocaleString()}`}
            subValue="USDC Debt"
            icon={DollarSign}
          />
          <MetricCard
            label="Collateralized Assets"
            value={`${totalCollateralValue.toLocaleString()} MNT`}
            subValue="Asset Buffer"
            icon={Wallet}
          />
          <MetricCard
            label="System Health"
            value="1.85 HF"
            subValue="Avg Protection"
            trend={{ value: 4.2, isPositive: true }}
            icon={Shield}
          />
        </div>

        {}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="relative w-full md:max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
            <input
              type="text"
              placeholder="Lookup Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1115] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-metrics focus:border-neon-cyan/50 outline-none transition-all"
            />
          </div>

          <div className="flex bg-[#0F1115] p-1 rounded-2xl border border-white/5">
            {(['all', 'active', 'pending', 'repaid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2 rounded-xl text-[10px] font-metrics font-bold uppercase tracking-widest transition-all ${filter === status
                  ? 'bg-white text-black'
                  : 'text-gray-500 hover:text-white'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredLoans.map((loan) => (
              <motion.div
                layout
                key={loan.id}
                variants={item}
                className="group p-6 rounded-3xl bg-[#0F1115] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-gray-400 group-hover:text-neon-cyan group-hover:border-neon-cyan/20 transition-all">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white font-metrics uppercase">{loan.amount} USDC</span>
                        <span className="text-[10px] text-gray-500 font-metrics uppercase tracking-wider">#{loan.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <StatusChip status={loan.status} label={loan.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 mb-8">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 items-center flex gap-1.5 font-bold">
                        <Shield className="w-3 h-3" /> Safety Factor
                      </span>
                      <span className={`text-sm font-bold font-metrics ${loan.healthFactor >= 1.5 ? 'text-neon-cyan' : 'text-risk-amber'}`}>
                        {loan.healthFactor.toFixed(2)} HF
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 items-center flex gap-1.5 font-bold">
                        <TrendingUp className="w-3 h-3" /> Interest APR
                      </span>
                      <span className="text-sm font-bold text-white font-metrics">
                        {loan.interestRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 items-center flex gap-1.5 font-bold">
                        <Wallet className="w-3 h-3" /> Collateral
                      </span>
                      <span className="text-sm font-bold text-white font-metrics uppercase">
                        {loan.collateralAmount} {loan.collateral}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 items-center flex gap-1.5 font-bold">
                        <Calendar className="w-3 h-3" /> Settlement
                      </span>
                      <span className="text-sm font-bold text-white font-metrics uppercase">
                        {loan.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/loans/${loan.id}`} className="flex-1">
                      <Button fullWidth size="sm" variant="secondary" className="text-[10px] font-metrics tracking-widest uppercase">
                        Inspect
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" className="px-4 text-[10px] font-metrics tracking-widest uppercase">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[50px] rounded-full group-hover:bg-neon-cyan/10 transition-all duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {}
        {filteredLoans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-[#0F1115] border border-dashed border-white/10 flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-gray-700" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-2">No Active Operations</h3>
            <p className="text-gray-500 font-metrics text-xs uppercase tracking-widest mb-8">
              Your asset portfolio is currently quiet. Initiate a new position to see it here.
            </p>
            <Button onClick={() => navigate('/loans/new')}>Initiate Command</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansPage;
