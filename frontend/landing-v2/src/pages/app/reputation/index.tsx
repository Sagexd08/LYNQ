import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { RiskBar, TierBadge, ScoreDisplay } from '@/components/ui/RiskIndicators';
import { Section, Panel, Card, InlineInspector } from '@/components/ui/Section';
import { useReputation, useAchievements } from '@/hooks/useReputation';
import { useAuth } from '@/hooks/useAuth';
import {
    Award,
    Star,
    Trophy,
    Gift,
    TrendingUp,
    Shield,
    Zap,
    Crown,
    CheckCircle,
    Lock,
    RefreshCw,
    Loader2,
    Sparkles,
} from 'lucide-react';

export default function ReputationPage() {
    const { data: reputationData, isLoading, refresh } = useReputation();
    const { earned: earnedAchievements } = useAchievements();
    const { profile } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const score = reputationData?.score || profile?.reputationScore || 750;
    const tier = reputationData?.tier || profile?.tier || 'GOLD';
    const tierLower = tier.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum';
    const rank = reputationData?.rank || 1284;
    const nextTier = reputationData?.nextTier;

    const factors = reputationData?.factors || [
        { name: 'Payment History', weight: 0.35, value: 95, contribution: 33.25 },
        { name: 'Loan Utilization', weight: 0.20, value: 72, contribution: 14.4 },
        { name: 'Collateral Quality', weight: 0.15, value: 88, contribution: 13.2 },
        { name: 'Account Age', weight: 0.15, value: 80, contribution: 12 },
        { name: 'DeFi Activity', weight: 0.15, value: 65, contribution: 9.75 },
    ];

    const pointsBreakdown = factors.map((factor, index) => {
        const icons = [
            <CheckCircle className="w-4 h-4 text-green-400" key="check" />,
            <Trophy className="w-4 h-4 text-amber-400" key="trophy" />,
            <Shield className="w-4 h-4 text-purple-400" key="shield" />,
            <Star className="w-4 h-4 text-cyan-400" key="star" />,
            <Zap className="w-4 h-4 text-yellow-400" key="zap" />,
        ];
        return {
            name: factor.name,
            points: Math.round(factor.contribution * 10),
            percentage: Math.round(factor.weight * 100),
            description: `Weight: ${Math.round(factor.weight * 100)}%`,
            trend: Math.floor(Math.random() * 15),
            icon: icons[index % icons.length],
        };
    });

    const tierBenefits = [
        { name: 'Reduced Rates', icon: TrendingUp, description: '-0.5% on all loan rates', active: tier !== 'BRONZE', unlockTier: 'Silver' },
        { name: 'Priority Support', icon: Zap, description: '24/7 dedicated support', active: tier === 'GOLD' || tier === 'PLATINUM', unlockTier: 'Gold' },
        { name: 'Higher Limits', icon: Trophy, description: 'Up to $50,000 loan limit', active: tier === 'GOLD' || tier === 'PLATINUM', unlockTier: 'Gold' },
        { name: 'Early Access', icon: Star, description: 'New features and pools', active: tier === 'GOLD' || tier === 'PLATINUM', unlockTier: 'Gold' },
        { name: 'Governance Power', icon: Award, description: 'Vote on protocol changes', active: tier === 'PLATINUM', unlockTier: 'Platinum' },
        { name: 'Fee Rebates', icon: Gift, description: '25% fee cashback', active: tier === 'PLATINUM', unlockTier: 'Platinum' },
        { name: 'Exclusive NFTs', icon: Crown, description: 'Limited edition drops', active: false, unlockTier: 'Diamond' },
        { name: 'Zero Fees', icon: Shield, description: 'No platform fees', active: false, unlockTier: 'Diamond' },
    ];

    const displayAchievements = earnedAchievements.length > 0
        ? earnedAchievements.map((a, i) => ({
            id: `A-${String(i + 1).padStart(2, '0')}`,
            name: a.name,
            points: 50 + i * 25,
            date: a.earnedAt ? new Date(a.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            status: 'earned',
        }))
        : [
            { id: 'A-01', name: 'First Loan Completed', points: 50, date: 'Mar 1, 2024', status: 'earned' },
            { id: 'A-02', name: '10 On-Time Payments', points: 100, date: 'Feb 15, 2024', status: 'earned' },
            { id: 'A-03', name: 'Gold Tier Reached', points: 200, date: 'Feb 1, 2024', status: 'earned' },
        ];

    const tierRequirements = [
        { name: 'bronze', minScore: 0, icon: Award, color: 'text-orange-500', current: tier === 'BRONZE' },
        { name: 'silver', minScore: 300, icon: Award, color: 'text-gray-400', current: tier === 'SILVER' },
        { name: 'gold', minScore: 600, icon: Crown, color: 'text-amber-400', current: tier === 'GOLD' },
        { name: 'platinum', minScore: 850, icon: Crown, color: 'text-cyan-400', current: tier === 'PLATINUM' },
        { name: 'diamond', minScore: 1500, icon: Crown, color: 'text-purple-400', current: false },
    ];

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-cyan-400" />
                            Reputation
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Build your on-chain credit history
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

                {/* Reputation Overview */}
                <div className="grid grid-cols-4 gap-4">
                    <Panel title="Your Tier" className="col-span-1" isLoading={isLoading}>
                        <div className="flex flex-col items-center py-6">
                            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${tier === 'PLATINUM' ? 'from-cyan-500 to-blue-400' :
                                tier === 'GOLD' ? 'from-amber-500 to-yellow-400' :
                                    tier === 'SILVER' ? 'from-gray-400 to-gray-300' :
                                        'from-orange-600 to-orange-400'
                                } flex items-center justify-center mb-4 shadow-lg`}>
                                <Crown className="w-10 h-10 text-white" />
                            </div>
                            <TierBadge tier={tierLower} size="lg" />
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                Rank #{rank.toLocaleString()}
                            </p>
                        </div>
                    </Panel>

                    <Panel title="Reputation Score" className="col-span-2" isLoading={isLoading}>
                        <div className="flex items-center justify-between py-4">
                            <ScoreDisplay score={score} maxScore={1000} label="LYNQ Score" size="lg" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-gray-300">+{Math.floor(Math.random() * 30) + 10} points this month</span>
                                </div>
                                <div className="flex gap-2">
                                    <InlineInspector label="Rank" value={`#${rank.toLocaleString()}`} />
                                    {nextTier && (
                                        <InlineInspector label="Next Tier" value={`${nextTier.pointsNeeded} pts`} />
                                    )}
                                </div>
                            </div>
                        </div>
                        {nextTier && (
                            <div className="mt-4 pt-4 border-t border-[#1f1f25]">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500">Progress to {nextTier.name}</span>
                                    <span className="font-mono text-cyan-400">{score} / {nextTier.requiredScore}</span>
                                </div>
                                <RiskBar value={Math.min(100, (score / nextTier.requiredScore) * 100)} showValue={false} />
                            </div>
                        )}
                    </Panel>

                    <Panel title="Reputation NFT" isLoading={isLoading}>
                        <div className="flex flex-col items-center py-4">
                            <div className="w-full h-32 bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] rounded-lg border border-[#1f1f25] flex items-center justify-center mb-4 relative overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${tier === 'PLATINUM' ? 'from-cyan-500/10' :
                                    tier === 'GOLD' ? 'from-amber-500/10' :
                                        tier === 'SILVER' ? 'from-gray-400/10' :
                                            'from-orange-500/10'
                                    } to-transparent`} />
                                <div className="text-center z-10">
                                    <Star className={`w-8 h-8 mx-auto mb-2 ${tier === 'PLATINUM' ? 'text-cyan-400' :
                                        tier === 'GOLD' ? 'text-amber-400' :
                                            tier === 'SILVER' ? 'text-gray-400' :
                                                'text-orange-400'
                                        }`} />
                                    <span className="text-xs text-gray-400">{tier} Tier NFT</span>
                                </div>
                            </div>
                            <button className="w-full text-xs py-2 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors">
                                View on Explorer
                            </button>
                        </div>
                    </Panel>
                </div>

                {/* Points Breakdown */}
                <Section title="Score Factors">
                    <div className="grid grid-cols-3 gap-4">
                        {pointsBreakdown.map((category) => (
                            <Card key={category.name}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {category.icon}
                                        <span className="text-sm text-gray-300">{category.name}</span>
                                    </div>
                                    <span className="font-mono text-lg text-cyan-400">{category.points}</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">{category.description}</p>
                                <RiskBar value={category.percentage} showValue={false} size="sm" />
                                <div className="flex justify-between mt-2 text-xs">
                                    <span className="text-gray-600">{category.percentage}% weight</span>
                                    {category.trend > 0 && (
                                        <span className="text-green-400">+{category.trend} this month</span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* Tier Benefits */}
                <Section title="Your Benefits">
                    <div className="grid grid-cols-4 gap-4">
                        {tierBenefits.map((benefit) => (
                            <Card key={benefit.name}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded ${benefit.active ? 'bg-cyan-500/10' : 'bg-[#1a1a1f]'}`}>
                                        <benefit.icon className={`w-4 h-4 ${benefit.active ? 'text-cyan-400' : 'text-gray-600'}`} />
                                    </div>
                                    <span className={`text-sm ${benefit.active ? 'text-gray-200' : 'text-gray-600'}`}>
                                        {benefit.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{benefit.description}</p>
                                {!benefit.active && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                        <Lock className="w-3 h-3" />
                                        <span>Unlocks at {benefit.unlockTier}</span>
                                    </div>
                                )}
                                {benefit.active && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Active</span>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* Achievement History */}
                <Section title="Recent Achievements">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            data={displayAchievements}
                            columns={achievementColumns}
                            emptyMessage="Complete loans to earn achievements!"
                        />
                    )}
                </Section>

                {/* Tier Comparison */}
                <Section title="Tier Requirements">
                    <div className="grid grid-cols-5 gap-3">
                        {tierRequirements.map((tierReq) => (
                            <Card
                                key={tierReq.name}
                                className={tierReq.current ? 'border-cyan-500/30 bg-cyan-500/5' : ''}
                            >
                                <div className="text-center py-4">
                                    <tierReq.icon className={`w-8 h-8 mx-auto mb-2 ${tierReq.color}`} />
                                    <TierBadge tier={tierReq.name as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'} size="sm" />
                                    <div className="mt-3 space-y-1">
                                        <div className="text-xs text-gray-500">Required Score</div>
                                        <div className="font-mono text-gray-300">{tierReq.minScore}+</div>
                                    </div>
                                    {tierReq.current && (
                                        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-cyan-400">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Current</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>
            </div>
        </AppShell>
    );
}

const achievementColumns = [
    { key: 'id', header: 'ID' },
    {
        key: 'name', header: 'Achievement', render: (row: { name: string }) => (
            <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-gray-200">{row.name}</span>
            </div>
        )
    },
    {
        key: 'points', header: 'Points', align: 'right' as const, render: (row: { points: number }) => (
            <span className="font-mono text-cyan-400">+{row.points}</span>
        )
    },
    { key: 'date', header: 'Date' },
    {
        key: 'status', header: 'Status', render: () => (
            <StatusBadge status="completed" label="Earned" />
        )
    },
];
