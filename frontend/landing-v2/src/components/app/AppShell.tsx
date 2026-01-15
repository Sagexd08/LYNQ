import { useState } from 'react';
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
  Zap,
  Wallet,
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

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-10 bg-[#0d0d0f] border-b border-[#1a1a1f] flex items-center justify-between px-4 text-xs font-mono">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Zap className="w-4 h-4" />
            <span className="tracking-wider">LYNQ</span>
          </Link>
          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1.5">
              <Blocks className="w-3 h-3 text-green-500" />
              <span className="text-gray-400">MAINNET</span>
            </span>
            <span className="text-gray-600">|</span>
            <span>
              Block <span className="text-gray-300">19,847,293</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusPill label="Risk" value="LOW" variant="success" />
          <StatusPill label="Score" value="847" />
          <div className="flex items-center gap-2 px-3 py-1 bg-[#111114] border border-[#1f1f25] rounded">
            <Wallet className="w-3 h-3 text-cyan-400" />
            <span className="text-gray-300">0x1a2b...9f8e</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <nav
          className={`${
            collapsed ? 'w-14' : 'w-48'
          } bg-[#0d0d0f] border-r border-[#1a1a1f] flex flex-col transition-all duration-200`}
        >
          <div className="flex-1 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-3 text-gray-600 hover:text-gray-400 border-t border-[#1a1a1f] flex items-center justify-center"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#0a0a0b] p-4">{children}</main>
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
  const colors = {
    default: 'text-cyan-400',
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${colors[variant]}`}>{value}</span>
    </div>
  );
}
