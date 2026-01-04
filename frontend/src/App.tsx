import { useState, useCallback } from 'react';
import { api } from './api';
import type { User, ReputationEvent } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { StatusScreen } from './screens/StatusScreen';
import { BorrowScreen } from './screens/BorrowScreen';
import { RepayScreen } from './screens/RepayScreen';
import { HistoryScreen } from './screens/HistoryScreen';

type ViewState = 'login' | 'status' | 'borrow' | 'repay' | 'history';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [history, setHistory] = useState<ReputationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updatedUser = await api.getUser(user.id);
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, [user?.id]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('status');
  };

  const handleBorrow = async (amount: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.applyLoan(user.id, amount);
      await refreshUser();
      setView('status');
    } catch (err) {
      alert('Failed to borrow: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (amount: number) => {
    const activeLoan = user?.loans.find(l => l.status !== 'repaid');
    if (!activeLoan) return;

    setLoading(true);
    try {
      await api.repayLoan(activeLoan.id, amount);
      await refreshUser();
      setView('status');
    } catch (err) {
      alert('Failed to repay: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const events = await api.getHistory(user.reputation?.userId || user.id); // reputation.userId should match user.id
      setHistory(events);
      setView('history');
    } catch (err) {
      alert('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Render logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-pulse text-neutral-400">Processing...</div>
        </div>
      );
    }

    if (!user || view === 'login') {
      return <LoginScreen onLogin={handleLogin} />;
    }

    switch (view) {
      case 'status':
        return (
          <StatusScreen
            user={user}
            onBorrow={() => setView('borrow')}
            onRepay={() => setView('repay')}
            onHistory={loadHistory}
          />
        );
      case 'borrow':
        return (
          <BorrowScreen
            user={user}
            onConfirm={handleBorrow}
            onCancel={() => setView('status')}
          />
        );
      case 'repay':
        const activeLoan = user.loans.find(l => l.status !== 'repaid');
        if (!activeLoan) return <div onClick={() => setView('status')}>Error: No active loan. Back</div>;
        return (
          <RepayScreen
            loan={activeLoan}
            onConfirm={handleRepay}
            onCancel={() => setView('status')}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            events={history}
            onBack={() => setView('status')}
          />
        );
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-emerald-500/30">
      <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col">
        {/* Simple Header if logged in */}
        {user && view !== 'login' && (
          <div className="flex justify-between items-center mb-6 text-sm text-neutral-500">
            <span>FLYN v0</span>
            <span>{user.phone}</span>
            <button onClick={() => { setUser(null); setView('login'); }} className="hover:text-white">Logout</button>
          </div>
        )}

        <main className="grow">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
