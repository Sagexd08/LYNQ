import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { RiskBar } from '@/components/ui/RiskIndicators';
import { Section, Panel, Card } from '@/components/ui/Section';
import { useMarkets, useLendingPools, useChainUtilization, useMarketTrends } from '@/hooks/useMarkets';
import { MarketChart } from '@/components/app/MarketChart';
import {
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff,
    RefreshCw,
    Loader2,
    BarChart3,
    Droplets,
    Percent,
    Activity,
} from 'lucide-react';

export default function MarketsPage() {
    const [showForecast, setShowForecast] = useState(false);
    const { data: marketData, isLoading: marketLoading, refresh: refreshMarkets } = useMarkets();
    const { pools, isLoading: poolsLoading } = useLendingPools();
    const { utilization, isLoading: utilizationLoading } = useChainUtilization();
    const { trends, isLoading: trendsLoading } = useMarketTrends();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshMarkets();
        setIsRefreshing(false);
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    const displayPools = pools.length > 0 ? pools : [
        { asset: 'ETH', chain: 'Mantle', apy: 8.4, apr: 12.5, liquidity: 45200000, utilization: 72, riskTier: 'Low' as const, totalBorrowed: 32500000, totalSupplied: 45200000 },
        { asset: 'USDC', chain: 'Mantle', apy: 5.2, apr: 8.8, liquidity: 32100000, utilization: 65, riskTier: 'Low' as const, totalBorrowed: 20800000, totalSupplied: 32100000 },
        { asset: 'MNT', chain: 'Mantle', apy: 9.2, apr: 14.1, liquidity: 8500000, utilization: 78, riskTier: 'Medium' as const, totalBorrowed: 6600000, totalSupplied: 8500000 },
    ];

    const topPools = [...displayPools].sort((a, b) => b.apy - a.apy).slice(0, 3);

    const riskDistribution = [
        { tier: 'Low', pools: displayPools.filter(p => p.riskTier === 'Low').length, color: 'bg-green-400' },
        { tier: 'Medium', pools: displayPools.filter(p => p.riskTier === 'Medium').length, color: 'bg-amber-400' },
        { tier: 'High', pools: displayPools.filter(p => p.riskTier === 'High').length, color: 'bg-red-400' },
    ];

    const displayTrends = trends.length > 0 ? trends : [
        { metric: 'Total Volume', value: '$58.4M', change: '+12.4%', direction: 'up' as const },
        { metric: 'Avg APY', value: '7.8%', change: '+0.6%', direction: 'up' as const },
        { metric: 'New Loans', value: '234', change: '+18%', direction: 'up' as const },
        { metric: 'Default Rate', value: '2.1%', change: '-0.3%', direction: 'down' as const },
    ];

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-cyan-400" />
                            Markets
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Explore lending pools and market analytics
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

                {/* Market Overview */}
                <MetricRow columns={5}>
                    <MetricCard
                        label="Total Markets"
                        value={marketData?.totalMarkets?.toString() || displayPools.length.toString()}
                        icon={<BarChart3 className="w-4 h-4" />}
                        isLoading={marketLoading}
                    />
                    <MetricCard
                        label="Total Liquidity"
                        value={formatCurrency(marketData?.totalLiquidity || displayPools.reduce((sum, p) => sum + p.liquidity, 0))}
                        variant="highlight"
                        icon={<Droplets className="w-4 h-4" />}
                        isLoading={marketLoading}
                    />
                    <MetricCard
                        label="24h Volume"
                        value={formatCurrency(marketData?.volume24h || 8200000)}
                        trend="up"
                        trendValue="+15%"
                        icon={<Activity className="w-4 h-4" />}
                        isLoading={marketLoading}
                    />
                    <MetricCard
                        label="Avg APY"
                        value={`${(marketData?.avgApy || 7.8).toFixed(1)}%`}
                        icon={<Percent className="w-4 h-4" />}
                        isLoading={marketLoading}
                    />
                    <MetricCard
                        label="Utilization"
                        value={`${(marketData?.utilization || 67.3).toFixed(1)}%`}
                        isLoading={marketLoading}
                    />
                </MetricRow>

                {/* Forecast Toggle */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Lending Pools
                    </h2>
                    <button
                        onClick={() => setShowForecast(!showForecast)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${showForecast
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'text-gray-500 border-[#1f1f25] hover:border-gray-600'
                            }`}
                    >
                        {showForecast ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {showForecast ? 'Forecast On' : 'Show Forecast'}
                    </button>
                </div>

                {/* Lending Pools Table */}
                {poolsLoading ? (
                    <div className="flex items-center justify-center py-12 bg-[#0a0a0c] rounded-lg border border-[#1f1f25]">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                ) : (
                    <DataTable
                        data={displayPools.map(pool => ({
                            ...pool,
                            liquidityFormatted: formatCurrency(pool.liquidity),
                            forecast: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
                            forecastChange: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`,
                        }))}
                        columns={getPoolColumns(showForecast)}
                        onRowClick={(row) => console.log('View pool:', row)}
                    />
                )}

                {/* Market Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Pools */}
                    <Panel title="Top Performing Pools" isLoading={poolsLoading}>
                        <div className="space-y-3">
                            {topPools.map((pool, index) => (
                                <div
                                    key={pool.asset}
                                    className="flex items-center justify-between p-3 bg-surface-100/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-accent-purple/20 rounded-full flex items-center justify-center text-xs font-bold text-primary-400">
                                                {pool.asset.slice(0, 2)}
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-300">{pool.asset}</span>
                                            <span className="text-xs text-gray-600 ml-2">{pool.chain}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-emerald-400">{pool.apy}%</span>
                                        <span className="text-xs text-gray-600 block">APY</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Utilization Rates */}
                    <Panel title="Utilization by Chain" isLoading={utilizationLoading}>
                        <div className="space-y-4">
                            {(utilization.length > 0 ? utilization : [
                                { name: 'Mantle', utilization: 68, borrowed: '48.2M', available: '22.8M' },
                            ]).map((chain) => (
                                <div key={chain.name} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">{chain.name}</span>
                                        <span className="font-mono text-gray-200">{chain.utilization}%</span>
                                    </div>
                                    <RiskBar value={chain.utilization} showValue={false} size="sm" />
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>${chain.borrowed} borrowed</span>
                                        <span>${chain.available} available</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Risk Distribution */}
                    <Panel title="Pool Risk Distribution">
                        <div className="space-y-3">
                            {riskDistribution.map((item) => (
                                <div
                                    key={item.tier}
                                    className="flex items-center justify-between p-3 bg-surface-100/30 rounded-lg border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                        <span className="text-sm text-gray-300">{item.tier} Risk</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-gray-200">{item.pools}</span>
                                        <span className="text-xs text-gray-600 ml-2">pools</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                {/* Market Chart */}
                <MarketChart />

                {/* Market Trends */}
                <Section title="Market Trends (7 Days)">
                    {trendsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {displayTrends.map((trend) => (
                                <Card key={trend.metric}>
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">{trend.metric}</span>
                                        {trend.direction === 'up' ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-rose-400" />
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-mono font-semibold text-gray-100">{trend.value}</span>
                                        <span className={`text-sm ${trend.direction === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {trend.change}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </AppShell>
    );
}

const getPoolColumns = (showForecast: boolean) => [
    {
        key: 'asset', header: 'Asset', render: (row: { asset: string }) => (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-cyan-400">
                    {row.asset.slice(0, 2)}
                </div>
                <span className="text-gray-200">{row.asset}</span>
            </div>
        )
    },
    {
        key: 'chain', header: 'Chain', render: (row: { chain: string }) => (
            <span className="text-gray-400">{row.chain}</span>
        )
    },
    {
        key: 'apy', header: 'APY', align: 'right' as const, sortable: true, render: (row: { apy: number }) => (
            <span className="font-mono text-green-400">{row.apy}%</span>
        )
    },
    {
        key: 'apr', header: 'APR', align: 'right' as const, sortable: true, render: (row: { apr: number }) => (
            <span className="font-mono text-amber-400">{row.apr}%</span>
        )
    },
    {
        key: 'liquidity', header: 'Liquidity', align: 'right' as const, sortable: true, render: (row: { liquidityFormatted: string }) => (
            <span className="font-mono">{row.liquidityFormatted}</span>
        )
    },
    {
        key: 'utilization', header: 'Utilization', align: 'right' as const, render: (row: { utilization: number }) => (
            <div className="flex items-center gap-2 justify-end">
                <div className="w-16 h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden">
                    <div
                        className={`h-full ${row.utilization > 80 ? 'bg-red-500' : row.utilization > 60 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${row.utilization}%` }}
                    />
                </div>
                <span className="font-mono text-gray-400 w-10 text-right">{row.utilization}%</span>
            </div>
        )
    },
    {
        key: 'riskTier', header: 'Risk', align: 'center' as const, render: (row: { riskTier: string }) => (
            <StatusBadge
                status={row.riskTier === 'Low' ? 'active' : row.riskTier === 'Medium' ? 'warning' : 'failed'}
                label={row.riskTier}
            />
        )
    },
    ...(showForecast ? [{
        key: 'forecast', header: 'Forecast', align: 'center' as const, render: (row: { forecast: string; forecastChange: string }) => (
            <div className="flex items-center justify-center gap-1">
                {row.forecast === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                ) : row.forecast === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                    <span className="text-gray-500">→</span>
                )}
                <span className={`text-xs ${row.forecast === 'up' ? 'text-green-400' : row.forecast === 'down' ? 'text-red-400' : 'text-gray-500'
                    }`}>
                    {row.forecastChange}
                </span>
            </div>
        )
    }] : []),
];
