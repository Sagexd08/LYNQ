import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { RiskBar, ConfidenceMeter, ScoreDisplay } from '@/components/ui/RiskIndicators';
import { Section, Panel, Card, InlineInspector } from '@/components/ui/Section';
import { useDashboard } from '@/hooks/useDashboard';
import { useLoans } from '@/hooks/useLoans';
import { useRiskEvaluation } from '@/hooks/useRisk';
import { useAuth } from '@/hooks/useAuth';
import {
    Shield,
    AlertTriangle,
    Activity,
    Target,
    Clock,
    RefreshCw,
    Loader2,
    TrendingUp,
    CheckCircle,
} from 'lucide-react';

export default function RiskPage() {
    const { data: dashboardData, isLoading: dashboardLoading, refresh: refreshDashboard } = useDashboard();
    const { loans, isLoading: loansLoading } = useLoans();
    const { riskData } = useRiskEvaluation();
    const { profile } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshDashboard();
        setIsRefreshing(false);
    };

    const userProfile = dashboardData?.userRiskProfile;
    const modelConfidence = dashboardData?.modelConfidence;

    const atRiskLoans = loans.filter(loan =>
        loan.status === 'ACTIVE' &&
        (loan.defaultProbability && loan.defaultProbability > 0.1)
    );

    const protocolRiskFactors = [
        { name: 'Market Volatility', value: '12.4%', level: 35, threshold: '<25%', status: 'warning', alert: true },
        { name: 'Collateral Concentration', value: '23%', level: 23, threshold: '<40%', status: 'safe', alert: false },
        { name: 'Liquidity Depth', value: '$45.2M', level: 15, threshold: '>$10M', status: 'safe', alert: false },
        { name: 'Default Correlation', value: '0.12', level: 12, threshold: '<0.3', status: 'safe', alert: false },
        { name: 'Oracle Lag', value: '2.1s', level: 21, threshold: '<5s', status: 'safe', alert: false },
    ];

    const riskAlerts = dashboardData?.riskAlerts?.map(alert => ({
        ...alert,
        actions: alert.severity === 'high' ? ['View Details', 'Take Action'] : ['Review', 'Dismiss'],
    })) || [
            {
                severity: 'warning' as const,
                title: 'Collateral Volatility Spike',
                description: 'ETH collateral showing 15% 24h volatility, above normal threshold',
                time: '5m ago',
                actions: ['View Details', 'Dismiss'],
            },
            {
                severity: 'warning' as const,
                title: 'Loan Health Warning',
                description: 'Some loans approaching liquidation threshold',
                time: '15m ago',
                actions: ['Add Collateral', 'View Loan'],
            },
            {
                severity: 'info' as const,
                title: 'Rate Adjustment Recommendation',
                description: 'Market conditions suggest rate increase of +0.3% for new loans',
                time: '1h ago',
                actions: ['Review'],
            },
        ];

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Shield className="w-6 h-6 text-cyan-400" />
                            Risk Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            AI-powered risk monitoring and analysis
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
                        Refresh
                    </button>
                </div>

                {/* Protocol Risk Overview */}
                <Section title="Protocol Risk Overview">
                    <MetricRow columns={5}>
                        <MetricCard
                            label="Global Default Probability"
                            value="2.3%"
                            trend="down"
                            trendValue="-0.4%"
                            variant="highlight"
                            icon={<Target className="w-4 h-4" />}
                            isLoading={dashboardLoading}
                        />
                        <MetricCard
                            label="Collateral Safety"
                            value="142%"
                            subValue="avg ratio"
                            trend="up"
                            trendValue="+3%"
                            icon={<Shield className="w-4 h-4" />}
                            isLoading={dashboardLoading}
                        />
                        <MetricCard
                            label="Liquidation Exposure"
                            value="$1.2M"
                            subValue="at risk"
                            trend="neutral"
                            trendValue="stable"
                            icon={<AlertTriangle className="w-4 h-4" />}
                            isLoading={dashboardLoading}
                        />
                        <MetricCard
                            label="At-Risk Loans"
                            value={atRiskLoans.length.toString()}
                            subValue={`/ ${loans.length}`}
                            icon={<Activity className="w-4 h-4" />}
                            isLoading={loansLoading}
                        />
                        <MetricCard
                            label="Avg Time to Liquidation"
                            value="4.2d"
                            trend="up"
                            trendValue="+0.8d"
                            icon={<Clock className="w-4 h-4" />}
                            isLoading={dashboardLoading}
                        />
                    </MetricRow>
                </Section>

                <div className="grid grid-cols-3 gap-4">
                    {/* Protocol Risk Breakdown */}
                    <Panel title="Risk Breakdown" className="col-span-2" isLoading={dashboardLoading}>
                        <div className="space-y-4">
                            {protocolRiskFactors.map((factor) => (
                                <div key={factor.name} className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-300">{factor.name}</span>
                                            {factor.alert && (
                                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-mono ${factor.status === 'safe' ? 'text-green-400' :
                                                factor.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {factor.value}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                threshold: {factor.threshold}
                                            </span>
                                        </div>
                                    </div>
                                    <RiskBar value={factor.level} size="sm" />
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Risk Model Confidence */}
                    <Panel title="AI Model Confidence" isLoading={dashboardLoading}>
                        <div className="flex flex-col items-center gap-6 py-4">
                            <ConfidenceMeter value={modelConfidence?.ensembleAgreement || 0.91} label="Overall" />
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Last Updated</span>
                                    <span className="text-gray-400">2 minutes ago</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Data Points</span>
                                    <span className="text-gray-400">1.2M</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Model Version</span>
                                    <span className="text-gray-400">v2.4.1</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Your Risk Profile */}
                <Section title="Your Risk Profile">
                    <div className="grid grid-cols-4 gap-4">
                        <Panel title="Risk Score" isLoading={dashboardLoading}>
                            <div className="flex items-center justify-center py-4">
                                <ScoreDisplay
                                    score={userProfile?.riskLevel || (riskData?.defaultProbability ? Math.round((riskData?.defaultProbability || 0) * 100) : 23)}
                                    maxScore={100}
                                    label="Risk Level"
                                    size="md"
                                />
                            </div>
                        </Panel>

                        <Panel title="vs. System Average">
                            <div className="space-y-4 py-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Your Risk</span>
                                    <span className="font-mono text-green-400">{userProfile?.riskLevel || 23}%</span>
                                </div>
                                <div className="relative h-4 bg-[#1a1a1f] rounded-full overflow-hidden">
                                    <div className="absolute h-full bg-cyan-500/30" style={{ width: `${userProfile?.riskLevel || 23}%` }} />
                                    <div className="absolute h-full w-0.5 bg-amber-400" style={{ left: '45%' }} title="System Avg: 45%" />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">0%</span>
                                    <span className="text-amber-400">System Avg: 45%</span>
                                    <span className="text-gray-600">100%</span>
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Liquidation Threshold">
                            <div className="space-y-4 py-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Current</span>
                                    <span className="font-mono text-gray-200">142%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Liquidation At</span>
                                    <span className="font-mono text-red-400">110%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Buffer</span>
                                    <span className="font-mono text-green-400">+32%</span>
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Reputation Trajectory">
                            <div className="flex flex-col items-center py-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    <span className="text-lg font-mono text-green-400">Improving</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    +12 points in last 30 days
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <InlineInspector label="Rank" value={`#${profile?.reputationScore ? Math.floor(1000 - profile.reputationScore) : 847}`} />
                                </div>
                            </div>
                        </Panel>
                    </div>
                </Section>

                {/* At-Risk Positions */}
                <Section title="At-Risk Positions">
                    {loansLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : atRiskLoans.length === 0 ? (
                        <Card>
                            <div className="text-center py-12 text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
                                <p className="text-lg font-medium text-green-400">All Clear</p>
                                <p className="text-sm mt-1">No positions at risk</p>
                            </div>
                        </Card>
                    ) : (
                        <DataTable
                            data={atRiskLoans.map(loan => ({
                                id: loan.id.slice(0, 8),
                                borrower: loan.userId?.slice(0, 10) || 'N/A',
                                collateral: `$${loan.amount * 1.2}`,
                                debt: `$${loan.amount}`,
                                healthFactor: 1.18,
                                timeToLiq: '~16h',
                                status: 'warning',
                            }))}
                            columns={riskColumns}
                            emptyMessage="No positions at risk"
                        />
                    )}
                </Section>

                {/* Risk Alerts */}
                <Section title="Active Alerts">
                    <div className="grid grid-cols-2 gap-4">
                        {riskAlerts.map((alert, i) => (
                            <Card key={i}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded ${alert.severity === 'high' ? 'bg-red-500/10' :
                                        alert.severity === 'warning' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
                                        }`}>
                                        <AlertTriangle className={`w-4 h-4 ${alert.severity === 'high' ? 'text-red-400' :
                                            alert.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-300">{alert.title}</span>
                                            <span className="text-xs text-gray-600">{alert.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                                        <div className="flex gap-2 mt-3">
                                            {alert.actions.map((action, j) => (
                                                <button
                                                    key={j}
                                                    className="text-xs px-3 py-1.5 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors"
                                                >
                                                    {action}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>
            </div>
        </AppShell>
    );
}

const riskColumns = [
    { key: 'id', header: 'Loan ID' },
    {
        key: 'borrower', header: 'Borrower', render: (row: { borrower: string }) => (
            <span className="font-mono text-cyan-400">{row.borrower}</span>
        )
    },
    { key: 'collateral', header: 'Collateral', align: 'right' as const },
    { key: 'debt', header: 'Debt', align: 'right' as const },
    {
        key: 'healthFactor', header: 'Health', align: 'right' as const, render: (row: { healthFactor: number }) => (
            <span className={`font-mono ${row.healthFactor >= 1.5 ? 'text-green-400' : row.healthFactor >= 1.2 ? 'text-amber-400' : 'text-red-400'}`}>
                {row.healthFactor.toFixed(2)}
            </span>
        )
    },
    {
        key: 'timeToLiq', header: 'Time to Liq', align: 'right' as const, render: (row: { timeToLiq: string }) => (
            <span className="text-amber-400">{row.timeToLiq}</span>
        )
    },
    {
        key: 'status', header: 'Status', render: (row: { status: string }) => (
            <StatusBadge status={row.status as 'warning'} />
        )
    },
];
