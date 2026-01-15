import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { RiskBar, ConfidenceMeter, TierBadge, ScoreDisplay } from '@/components/ui/RiskIndicators';
import { Section, Panel, Card, InlineInspector } from '@/components/ui/Section';
import { useDashboard, useProtocolStats } from '@/hooks/useDashboard';
import { useLoans } from '@/hooks/useLoans';
import { useAuth } from '@/hooks/useAuth';
import {
    TrendingUp,
    AlertTriangle,
    Coins,
    Users,
    Activity,
    Shield,
    ArrowUpRight,
    RefreshCw,
    Loader2,
    Zap,
    TrendingDown,
} from 'lucide-react';

export default function DashboardPage() {
    const { data: dashboardData, isLoading: dashboardLoading, refresh: refreshDashboard } = useDashboard();
    const { stats, isLoading: statsLoading, refresh: refreshStats } = useProtocolStats();
    const { loans, isLoading: loansLoading } = useLoans();
    const { profile, isAuthenticated } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refreshDashboard(), refreshStats()]);
        setIsRefreshing(false);
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

    const recentLoans = dashboardData?.recentLoans || loans.slice(0, 5);
    const riskAlerts = dashboardData?.riskAlerts || [];
    const marketSignals = dashboardData?.marketSignals || [];
    const userProfile = dashboardData?.userRiskProfile;
    const modelConfidence = dashboardData?.modelConfidence;

    const displayStats = stats || {
        totalValueLocked: 47200000,
        activeLoans: 1847,
        defaultProbability: 0.023,
        liquidationExposure: 1200000,
        totalUsers: 4291,
    };

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Refresh */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-cyan-400" />
                            Protocol Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Real-time analytics and risk monitoring
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-[#111114] border border-[#1f1f25] rounded-lg hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-all disabled:opacity-50"
                    >
                        {isRefreshing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Refresh Data
                    </button>
                </div>

                {/* Primary Metrics */}
                <MetricRow columns={5}>
                    <MetricCard
                        label="Total Value Locked"
                        value={formatCurrency(displayStats.totalValueLocked)}
                        trend="up"
                        trendValue="+12.4% (24h)"
                        icon={<Coins className="w-4 h-4" />}
                        isLoading={statsLoading}
                    />
                    <MetricCard
                        label="Active Loans"
                        value={displayStats.activeLoans.toLocaleString()}
                        subValue="loans"
                        trend="up"
                        trendValue="+23"
                        icon={<Activity className="w-4 h-4" />}
                        isLoading={statsLoading}
                    />
                    <MetricCard
                        label="Default Probability"
                        value={formatPercentage(displayStats.defaultProbability)}
                        trend="down"
                        trendValue="-0.4%"
                        variant="highlight"
                        icon={<AlertTriangle className="w-4 h-4" />}
                        isLoading={statsLoading}
                    />
                    <MetricCard
                        label="Liquidation Exposure"
                        value={formatCurrency(displayStats.liquidationExposure)}
                        subValue="at risk"
                        trend="neutral"
                        trendValue="stable"
                        icon={<Shield className="w-4 h-4" />}
                        isLoading={statsLoading}
                    />
                    <MetricCard
                        label="Active Users"
                        value={displayStats.totalUsers.toLocaleString()}
                        trend="up"
                        trendValue="+89"
                        icon={<Users className="w-4 h-4" />}
                        isLoading={statsLoading}
                    />
                </MetricRow>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Risk Overview */}
                    <Panel title="Your Risk Profile" isLoading={dashboardLoading}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <ScoreDisplay
                                    score={userProfile?.creditScore || profile?.reputationScore || 750}
                                    label="Credit Score"
                                    size="sm"
                                />
                                <TierBadge
                                    tier={(userProfile?.tier?.toLowerCase() || profile?.tier?.toLowerCase() || 'gold') as 'bronze' | 'silver' | 'gold' | 'platinum'}
                                    size="md"
                                />
                            </div>
                            <div className="space-y-3">
                                <RiskBar value={userProfile?.riskLevel || 23} label="Risk Level" />
                                <RiskBar value={userProfile?.collateralUtilization || 45} label="Collateral Utilization" />
                                <RiskBar value={userProfile?.liquidationProximity || 12} label="Liquidation Proximity" />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <InlineInspector label="Max Borrow" value={`$${(userProfile?.maxBorrow || 25000).toLocaleString()}`} />
                                <InlineInspector label="Health Factor" value={(userProfile?.healthFactor || 1.85).toFixed(2)} />
                            </div>
                        </div>
                    </Panel>

                    {/* Model Confidence */}
                    <Panel title="AI Model Confidence" isLoading={dashboardLoading}>
                        <div className="flex items-center justify-around py-4">
                            <ConfidenceMeter value={modelConfidence?.credit || 0.92} label="Credit" />
                            <ConfidenceMeter value={modelConfidence?.fraud || 0.78} label="Fraud" />
                            <ConfidenceMeter value={modelConfidence?.default || 0.85} label="Default" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Ensemble Agreement</span>
                                <span className="font-mono text-emerald-400">
                                    {((modelConfidence?.ensembleAgreement || 0.942) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-gray-500">Model Version</span>
                                <span className="font-mono text-gray-400">v2.4.1</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-gray-500">Last Updated</span>
                                <span className="text-gray-400">2 minutes ago</span>
                            </div>
                        </div>
                    </Panel>

                    {/* Quick Stats */}
                    <Panel title="Protocol Health" isLoading={statsLoading}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-sm text-gray-400">Total Collateral</span>
                                <span className="font-mono text-gray-200">
                                    {formatCurrency(stats?.totalCollateral || 58400000)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-sm text-gray-400">Utilization Rate</span>
                                <span className="font-mono text-primary-400">
                                    {formatPercentage(stats?.utilizationRate || 0.673)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-sm text-gray-400">Avg. APY</span>
                                <span className="font-mono text-emerald-400">
                                    {formatPercentage(stats?.avgInterestRate || 0.084)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-400">Health Factor Avg</span>
                                <span className="font-mono text-amber-400">
                                    {(stats?.avgHealthFactor || 1.85).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Recent Activity */}
                <Section title="Recent Loans Activity">
                    {loansLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            data={recentLoans.map(loan => ({
                                id: loan.id.slice(0, 8),
                                borrower: `${loan.userId?.slice(0, 6)}...${loan.userId?.slice(-4)}` || 'N/A',
                                amount: loan.amount,
                                rate: loan.interestRate,
                                term: `${loan.termMonths}mo`,
                                status: loan.status.toLowerCase(),
                                health: loan.status === 'ACTIVE' ? 1.85 : 0,
                            }))}
                            columns={loanColumns}
                            onRowClick={(row) => console.log('View loan:', row)}
                            compact
                            emptyMessage="No loans found. Create your first loan to get started!"
                        />
                    )}
                </Section>

                {/* Risk Alerts */}
                <div className="grid grid-cols-2 gap-4">
                    <Section title="Active Risk Alerts">
                        <Card>
                            <div className="space-y-3">
                                {riskAlerts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No active alerts</p>
                                    </div>
                                ) : (
                                    riskAlerts.map((alert, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 p-3 bg-[#111114] rounded border border-[#1f1f25] hover:border-[#2a2a32] transition-colors"
                                        >
                                            <AlertTriangle
                                                className={`w-4 h-4 mt-0.5 ${alert.severity === 'high'
                                                    ? 'text-red-400'
                                                    : alert.severity === 'medium'
                                                        ? 'text-amber-400'
                                                        : 'text-cyan-400'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-300">{alert.title}</span>
                                                    <span className="text-xs text-gray-600">{alert.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </Section>

                    <Section title="Market Signals">
                        <Card>
                            <div className="space-y-3">
                                {marketSignals.map((signal, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-[#111114] rounded border border-[#1f1f25] hover:border-[#2a2a32] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {signal.direction === 'up' ? (
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                            )}
                                            <div>
                                                <span className="text-sm text-gray-300">{signal.asset}</span>
                                                <span className="text-xs text-gray-600 ml-2">{signal.signal}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`font-mono text-sm ${signal.direction === 'up' ? 'text-green-400' : 'text-red-400'
                                                    }`}
                                            >
                                                {signal.change}
                                            </span>
                                            <ArrowUpRight className="w-3 h-3 text-gray-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Section>
                </div>

                {/* Connection Status */}
                {!isAuthenticated && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <div>
                                <p className="text-sm font-medium text-amber-400">Not Connected</p>
                                <p className="text-xs text-gray-500">Connect your wallet to view personalized data</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

const loanColumns = [
    { key: 'id', header: 'Loan ID', width: '100px' },
    {
        key: 'borrower', header: 'Borrower', render: (row: { borrower: string }) => (
            <span className="text-cyan-400 font-mono">{row.borrower}</span>
        )
    },
    {
        key: 'amount', header: 'Amount', align: 'right' as const, render: (row: { amount: number }) => (
            <span className="font-mono">${row.amount.toLocaleString()}</span>
        )
    },
    {
        key: 'rate', header: 'Rate', align: 'right' as const, render: (row: { rate: number }) => (
            <span className="text-gray-400">{row.rate}%</span>
        )
    },
    { key: 'term', header: 'Term', align: 'center' as const },
    {
        key: 'status', header: 'Status', render: (row: { status: string }) => (
            <StatusBadge status={row.status as 'active' | 'pending' | 'completed' | 'warning'} />
        )
    },
    {
        key: 'health', header: 'Health', align: 'right' as const, render: (row: { health: number }) => (
            row.health > 0 ? (
                <span className={`font-mono ${row.health >= 1.5 ? 'text-green-400' : row.health >= 1.2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {row.health.toFixed(2)}
                </span>
            ) : <span className="text-gray-600">-</span>
        )
    },
];
