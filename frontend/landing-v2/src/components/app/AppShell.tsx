import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileCode2,
  TrendingUp,
  Shield,
  Briefcase,
  Award,
  Settings,
  ChevronLeft,
  Blocks,
  Wallet,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app/intelligence', icon: Brain, label: 'Intelligence' },
  { path: '/app/protocol', icon: FileCode2, label: 'Protocol' },
  { path: '/app/markets', icon: TrendingUp, label: 'Markets' },
  { path: '/app/risk', icon: Shield, label: 'Risk' },
  { path: '/app/portfolio', icon: Briefcase, label: 'Portfolio' },
  { path: '/app/reputation', icon: Award, label: 'Reputation' },
  { path: '/app/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-primary-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-surface-50/70 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500 blur-lg opacity-20" />
              <img src="/LYNQ.png" alt="LYNQ" className="relative h-8 w-auto" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              LYNQ
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4 ml-6 pl-6 border-l border-white/5 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1.5">
              <Blocks className="w-3 h-3 text-emerald-500" />
              <span className="text-gray-400">MAINNET</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>
              Block <span className="text-gray-300">19,847,293</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="hidden sm:flex items-center gap-3">
            <StatusPill label="Risk" value="LOW" variant="success" />
            <StatusPill label="Score" value="847" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-100/50 hover:bg-surface-100 border border-white/5 hover:border-primary-500/30 rounded-lg transition-all cursor-pointer group">
            <Wallet className="w-4 h-4 text-primary-400 group-hover:text-primary-300" />
            <span className="text-sm text-gray-300 group-hover:text-white font-mono">0x1a...9f8e</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Mobile Navigation Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden user-select-none"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Navigation Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${collapsed ? 'lg:w-20' : 'lg:w-64'}
            w-64 bg-surface-50/80 backdrop-blur-xl border-r border-white/5 
            flex flex-col transition-all duration-300 ease-spring
          `}
        >
          {/* Mobile Header in Drawer */}
          <div className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-white/5">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group
                    ${isActive
                      ? 'bg-primary-500/10 text-primary-400 shadow-[0_0_20px_-5px_rgba(14,165,233,0.3)]'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className={`${collapsed ? 'lg:hidden' : 'block'}`}>
                    {item.label}
                  </span>
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors group">
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className={`${collapsed ? 'lg:hidden' : 'block'}`}>Disconnect</span>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-full items-center justify-center p-2 text-gray-600 hover:text-gray-300 transition-colors"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="min-h-full p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface StatusPillProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatusPill({ label, value, variant = 'default' }: StatusPillProps) {
  const styles = {
    default: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border ${styles[variant]}`}>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <span className="font-mono text-xs font-bold">{value}</span>
    </div>
  );
}
