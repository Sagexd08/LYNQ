import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { RiskBar } from '@/components/ui/RiskIndicators';
import { Section, Panel, Card } from '@/components/ui/Section';
import { usePortfolio, useAssetBreakdown, useTransactions } from '@/hooks/usePortfolio';
import { useLoans } from '@/hooks/useLoans';
import { useCollateral } from '@/hooks/useCollateral';
import { useAuth } from '@/hooks/useAuth';
import {
    Briefcase,
    Coins,
    Lock,
    PiggyBank,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    RefreshCw,
    Loader2,
    Plus,
    Unlock,
    TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
    const { portfolio, isLoading: portfolioLoading, refresh: refreshPortfolio } = usePortfolio();
    const { assets, isLoading: assetsLoading, refresh: refreshAssets } = useAssetBreakdown();
    const { transactions, isLoading: transactionsLoading } = useTransactions();
    const { loans, isLoading: loansLoading } = useLoans();
    const { collaterals, isLoading: collateralsLoading, fetchCollaterals } = useCollateral();
    const { isAuthenticated } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCollaterals();
        }
    }, [isAuthenticated, fetchCollaterals]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refreshPortfolio(), refreshAssets(), fetchCollaterals()]);
        setIsRefreshing(false);
        toast.success('Portfolio data refreshed');
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    const activeLoans = portfolio?.activeLoans || loans.filter(l => l.status === 'ACTIVE');
    const totalBorrowed = portfolio?.totalBorrowed || activeLoans.reduce((sum, l) => sum + l.amount, 0);

    const collateralValue = collaterals.filter(c => c.status === 'LOCKED').reduce((sum, c) => sum + c.valueUsd, 0);
    const healthFactor = portfolio?.healthFactor || (totalBorrowed > 0 ? collateralValue / totalBorrowed : 999);
    const availableCredit = portfolio?.availableCredit || Math.max(0, 50000 - totalBorrowed);
    const totalPortfolioValue = portfolio?.totalValue || (collateralValue + availableCredit);

    const displayAssets = assets.length > 0 ? assets : [
        { symbol: 'ETH', name: 'Ethereum', balance: '0.00 ETH', value: 0, change: 0 },
        { symbol: 'USDC', name: 'USD Coin', balance: '0.00 USDC', value: 0, change: 0 },
    ];

    const collateralPositions = collaterals.filter(c => c.status === 'LOCKED').map(c => ({
        id: c.id,
        loanId: c.loanId,
        asset: c.tokenSymbol,
        amount: `${c.amount.toFixed(4)} ${c.tokenSymbol}`,
        value: c.valueUsd,
        lockDate: new Date(c.lockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        utilization: c.utilization || Math.round((c.valueUsd / (c.valueUsd + 1000)) * 100),
        status: c.status.toLowerCase(),
    }));

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-cyan-400" />
                            Portfolio Overview
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your assets, loans, and collateral positions
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

                {/* Portfolio Overview */}
                <MetricRow columns={5}>
                    <MetricCard
                        label="Total Portfolio Value"
                        value={formatCurrency(totalPortfolioValue)}
                        trend="up"
                        trendValue="+5.1%"
                        variant="highlight"
                        icon={<Briefcase className="w-4 h-4" />}
                        isLoading={portfolioLoading}
                    />
                    <MetricCard
                        label="Active Loans"
                        value={activeLoans.length.toString()}
                        subValue="loans"
                        icon={<PiggyBank className="w-4 h-4" />}
                        isLoading={loansLoading}
                    />
                    <MetricCard
                        label="Total Borrowed"
                        value={formatCurrency(totalBorrowed)}
                        icon={<Coins className="w-4 h-4" />}
                        isLoading={loansLoading}
                    />
                    <MetricCard
                        label="Collateral Locked"
                        value={formatCurrency(collateralValue)}
                        icon={<Lock className="w-4 h-4" />}
                        isLoading={collateralsLoading}
                    />
                    <MetricCard
                        label="Available Credit"
                        value={formatCurrency(availableCredit)}
                        icon={<Wallet className="w-4 h-4" />}
                        isLoading={portfolioLoading}
                    />
                </MetricRow>

                <div className="grid grid-cols-3 gap-4">
                    {/* Asset Breakdown */}
                    <Panel title="Asset Breakdown" className="col-span-2" isLoading={assetsLoading}>
                        <div className="space-y-4">
                            {displayAssets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Coins className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p>No assets found</p>
                                </div>
                            ) : (
                                displayAssets.map((asset) => (
                                    <div key={asset.symbol} className="flex items-center gap-4 p-3 bg-[#111114] rounded border border-[#1f1f25] hover:border-[#2a2a32] transition-colors">
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-sm font-bold text-cyan-400">
                                            {asset.symbol.slice(0, 2)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-200 font-medium">{asset.symbol}</span>
                                                <span className="font-mono text-gray-200">{asset.balance}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-600">{asset.name}</span>
                                                <span className="text-xs text-gray-400">${asset.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1 ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {asset.change >= 0 ? (
                                                <ArrowUpRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4" />
                                            )}
                                            <span className="text-sm font-mono">{asset.change >= 0 ? '+' : ''}{asset.change.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Panel>

                    {/* Portfolio Health */}
                    <Panel title="Portfolio Health" isLoading={portfolioLoading}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-400">Health Factor</span>
                                <span className={`font-mono text-lg ${healthFactor >= 1.5 ? 'text-green-400' : healthFactor >= 1.2 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {Math.min(healthFactor, 99).toFixed(2)}
                                </span>
                            </div>
                            <RiskBar value={Math.min(100, (1 / healthFactor) * 100)} label="Risk Level" />
                            <div className="pt-4 border-t border-[#1f1f25] space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Collateral Ratio</span>
                                    <span className="font-mono text-gray-300">
                                        {totalBorrowed > 0 ? Math.round((collateralValue / totalBorrowed) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Liquidation At</span>
                                    <span className="font-mono text-red-400">110%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Safety Buffer</span>
                                    <span className="font-mono text-green-400">
                                        +${Math.max(0, collateralValue - totalBorrowed * 1.1).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="pt-4 border-t border-[#1f1f25] space-y-2">
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                                    <Plus className="w-4 h-4" />
                                    Add Collateral
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#111114] border border-[#1f1f25] rounded-lg text-gray-400 hover:border-gray-600 transition-colors">
                                    <TrendingUp className="w-4 h-4" />
                                    View Analytics
                                </button>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Active Loans */}
                <Section title="Active Loans">
                    {loansLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            data={activeLoans.map(loan => ({
                                id: loan.id.slice(0, 8),
                                amount: loan.amount,
                                rate: loan.interestRate,
                                term: `${loan.termMonths}mo`,
                                borrowed: new Date(loan.createdAt).toLocaleDateString(),
                                due: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A',
                                repaid: loan.amountRepaid,
                                status: loan.status.toLowerCase(),
                                health: loan.status === 'ACTIVE' ? (collateralValue / loan.amount) : 0,
                            }))}
                            columns={loanColumns}
                            onRowClick={(row) => console.log('View loan:', row)}
                            emptyMessage="No active loans. Start borrowing to build your reputation!"
                        />
                    )}
                </Section>

                {/* Collateral Details */}
                <Section title="Collateral Positions">
                    {collateralsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : collateralPositions.length === 0 ? (
                        <Card>
                            <div className="text-center py-12 text-gray-500">
                                <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No collateral positions</p>
                                <p className="text-sm mt-1">Lock collateral to secure your loans</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {collateralPositions.map((position) => (
                                <Card key={position.id}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-xs text-gray-500">Loan {position.loanId?.slice(0, 8)}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-lg font-medium text-gray-200">{position.asset}</span>
                                                <StatusBadge status={position.status as 'active'} />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500">Value</span>
                                            <div className="font-mono text-gray-200">${position.value.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Amount Locked</span>
                                            <span className="font-mono text-gray-300">{position.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Lock Date</span>
                                            <span className="text-gray-300">{position.lockDate}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Utilization</span>
                                            <span className="font-mono text-gray-300">{position.utilization}%</span>
                                        </div>
                                        <RiskBar value={position.utilization} showValue={false} size="sm" />
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#1f1f25] flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors">
                                            <Plus className="w-3 h-3" />
                                            Add Collateral
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors">
                                            <Unlock className="w-3 h-3" />
                                            Withdraw
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Transaction History */}
                <Section title="Recent Transactions">
                    {transactionsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            data={transactions.map(tx => ({
                                id: tx.id,
                                type: tx.type.replace('_', ' '),
                                amount: tx.amount,
                                loan: tx.loanId?.slice(0, 8) || 'N/A',
                                date: new Date(tx.date).toLocaleDateString(),
                                status: tx.status,
                            }))}
                            columns={transactionColumns}
                            compact
                            emptyMessage="No transactions yet"
                        />
                    )}
                </Section>
            </div>
        </AppShell>
    );
}

const loanColumns = [
    { key: 'id', header: 'Loan ID' },
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
    { key: 'due', header: 'Due Date' },
    {
        key: 'repaid', header: 'Repaid', align: 'right' as const, render: (row: { repaid: number; amount: number }) => (
            <div className="text-right">
                <span className="font-mono">${row.repaid.toLocaleString()}</span>
                <span className="text-xs text-gray-600 ml-1">/ ${row.amount.toLocaleString()}</span>
            </div>
        )
    },
    {
        key: 'health', header: 'Health', align: 'right' as const, render: (row: { health: number }) => (
            <span className={`font-mono ${row.health >= 1.5 ? 'text-green-400' : 'text-amber-400'}`}>
                {row.health.toFixed(2)}
            </span>
        )
    },
    {
        key: 'status', header: 'Status', render: (row: { status: string }) => (
            <StatusBadge status={row.status as 'active'} />
        )
    },
];

const transactionColumns = [
    { key: 'id', header: 'TX ID' },
    {
        key: 'type', header: 'Type', render: (row: { type: string }) => (
            <span className={`${row.type.includes('REPAYMENT') ? 'text-green-400' :
                row.type.includes('BORROW') ? 'text-cyan-400' : 'text-gray-300'
                }`}>
                {row.type}
            </span>
        )
    },
    {
        key: 'amount', header: 'Amount', align: 'right' as const, render: (row: { amount: string }) => (
            <span className="font-mono">{row.amount}</span>
        )
    },
    { key: 'loan', header: 'Loan' },
    { key: 'date', header: 'Date' },
    {
        key: 'status', header: 'Status', render: (row: { status: string }) => (
            <StatusBadge status={row.status as 'completed'} />
        )
    },
];
