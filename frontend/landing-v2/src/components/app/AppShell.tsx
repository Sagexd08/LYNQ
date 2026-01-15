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
  Menu,
  X,
  ChevronRight,
  Activity,
  Server
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

  const currentPath = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 flex flex-col font-mono selection:bg-green-500/30 selection:text-green-200">
      {/* Infrastructure Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] bg-[size:100%_4px] opacity-10 pointer-events-none" />
      </div>

      {/* Top Bar - Utilitarian Style */}
      <header className="sticky top-0 z-40 h-14 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-6 h-6 border border-white/20 flex items-center justify-center group-hover:border-green-500/50 transition-colors">
              <div className="w-3 h-3 bg-white/20 group-hover:bg-green-500 transition-colors" />
            </div>
            <span className="text-sm font-bold tracking-widest text-white group-hover:text-green-500 transition-colors">LYNQ</span>
          </Link>

          {/* Breadcrumbs - 'One screen = one proof' style */}
          <div className="hidden md:flex items-center gap-2 ml-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Protocol</span>
            {currentPath.slice(1).map((segment, i) => (
              <div key={i} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                <span className={i === currentPath.length - 2 ? 'text-white' : ''}>{segment}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>System: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-3 h-3" />
              <span>Latency: 12ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Block: #19,284,331</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Mobile Navigation Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Navigation Sidebar - 'Terminal' Style */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${collapsed ? 'lg:w-16' : 'lg:w-64'}
            bg-[#050505]/95 backdrop-blur border-r border-white/10 
            flex flex-col transition-all duration-300
          `}
        >
          {/* Mobile Header in Drawer */}
          <div className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-white/10">
            <span className="font-bold text-xs uppercase tracking-widest text-white">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 py-6 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-all
                    ${isActive
                      ? 'text-white bg-white/5 border-l-2 border-green-500'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-gray-600'}`} />
                  <span className={`${collapsed ? 'lg:hidden' : 'block'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/10">
            <div className={`p-4 bg-white/5 border border-white/10 ${collapsed ? 'hidden' : 'block'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase text-gray-500">Risk Engine</div>
                <Activity className="w-3 h-3 text-green-500" />
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exposure</span>
                  <span className="text-white">14%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-green-500">HEALTHY</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mt-4 flex w-full items-center justify-center p-2 text-gray-600 hover:text-white transition-colors"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="min-h-full p-4 md:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
