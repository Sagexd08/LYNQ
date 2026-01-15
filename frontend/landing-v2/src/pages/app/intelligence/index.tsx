import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable } from '@/components/ui/DataTable';
import { RiskBar, ConfidenceMeter, ScoreDisplay } from '@/components/ui/RiskIndicators';
import { Panel, Card, InlineInspector } from '@/components/ui/Section';
import { useIntelligence, useModelInfo } from '@/hooks/useIntelligence';
import { useRiskEvaluation } from '@/hooks/useRisk';
import { useAuth } from '@/hooks/useAuth';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    Activity,
    RefreshCw,
    Loader2,
    Sparkles,
    Lightbulb,
    Target,
} from 'lucide-react';

type Tab = 'credit' | 'fraud' | 'ensemble' | 'predictive';

export default function IntelligencePage() {
    const [activeTab, setActiveTab] = useState<Tab>('credit');
    const { data: intelligenceData, isLoading, refresh } = useIntelligence();
    const { modelInfo } = useModelInfo();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const tabs = [
        { id: 'credit', label: 'Credit Engine', icon: Brain },
        { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle },
        { id: 'ensemble', label: 'Ensemble Models', icon: BarChart3 },
        { id: 'predictive', label: 'Predictive Analytics', icon: TrendingUp },
    ] as const;

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Brain className="w-6 h-6 text-cyan-400" />
                            AI Intelligence
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            ML-powered risk assessment and predictions
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500">
                            Model: <span className="text-cyan-400">{modelInfo?.version || 'v2.4.1'}</span>
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
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 bg-[#0d0d0f] border border-[#1f1f25] rounded-lg">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'credit' && <CreditEngineTab isLoading={isLoading} />}
                {activeTab === 'fraud' && <FraudDetectionTab isLoading={isLoading} />}
                {activeTab === 'ensemble' && <EnsembleModelsTab isLoading={isLoading} />}
                {activeTab === 'predictive' && <PredictiveAnalyticsTab intelligenceData={intelligenceData} isLoading={isLoading} />}
            </div>
        </AppShell>
    );
}

function CreditEngineTab({ isLoading }: { isLoading: boolean }) {
    const { profile } = useAuth();
    const { riskData, evaluateRisk, isLoading: evaluating } = useRiskEvaluation();
    const [loanAmount, setLoanAmount] = useState(10000);
    const [collateral, setCollateral] = useState(15000);
    const [term, setTerm] = useState(6);

    const score = profile?.reputationScore || riskData?.creditScore || 750;

    const handleSimulate = async () => {
        if (profile?.walletAddress) {
            await evaluateRisk({
                walletAddress: profile.walletAddress,
                loanAmount,
                collateralValueUsd: collateral,
                termMonths: term,
            });
        }
    };

    const creditFactors = [
        { name: 'Payment History', score: 245, impact: 85, description: 'On-time payments', trend: 'up', change: '+12' },
        { name: 'Credit Utilization', score: 198, impact: 72, description: '32% used', trend: 'neutral', change: '0' },
        { name: 'Account Age', score: 156, impact: 65, description: '2.4 years avg', trend: 'up', change: '+5' },
        { name: 'Loan Performance', score: 142, impact: 78, description: `${profile?.successfulLoans || 0} completed`, trend: 'up', change: '+8' },
        { name: 'Collateral Quality', score: 106, impact: 58, description: 'MNT, USDC', trend: 'neutral', change: '0' },
    ];

    const scoreHistory = Array.from({ length: 30 }, (_, i) => ({
        date: `${i + 1}`,
        score: Math.min(1000, Math.max(500, score - 50 + Math.random() * 100)),
    }));

    return (
        <div className="space-y-6">
            {/* Current Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel title="Current Credit Score" isLoading={isLoading}>
                    <div className="flex items-center justify-center py-6">
                        <ScoreDisplay score={score} maxScore={1000} label="LYNQ Score" size="lg" />
                    </div>
                    <div className="flex gap-2 justify-center mt-4">
                        <InlineInspector label="Percentile" value={`Top ${Math.max(5, 100 - Math.round(score / 10))}%`} />
                        <InlineInspector label="Trend" value="↑ +23" />
                    </div>
                </Panel>

                <Panel title="Factor Breakdown" className="lg:col-span-2" isLoading={isLoading}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {creditFactors.map((factor) => (
                            <div key={factor.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{factor.name}</span>
                                    <span className="font-mono text-gray-200">{factor.score}</span>
                                </div>
                                <RiskBar value={factor.impact} max={100} size="sm" showValue={false} />
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">{factor.description}</span>
                                    <span className={factor.trend === 'up' ? 'text-emerald-400' : factor.trend === 'down' ? 'text-rose-400' : 'text-gray-500'}>
                                        {factor.trend === 'up' ? '↑' : factor.trend === 'down' ? '↓' : '→'} {factor.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            {/* Historical Trend */}
            <Panel title="Score History (30 Days)">
                <div className="h-48 flex items-end justify-between gap-1 px-4">
                    {scoreHistory.map((point, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div
                                className="w-full bg-gradient-to-t from-primary-500/30 to-primary-500/10 rounded-t hover:from-primary-500/50 hover:to-primary-500/20 transition-colors cursor-pointer"
                                style={{ height: `${(point.score / 1000) * 180}px` }}
                                title={`Day ${point.date}: ${Math.round(point.score)}`}
                            />
                            {i % 7 === 0 && <span className="text-xs text-gray-600 mt-1">{point.date}</span>}
                        </div>
                    ))}
                </div>
            </Panel>

            {/* What-if Simulator */}
            <Panel title="What-If Simulator">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Loan Amount</span>
                                <span className="font-mono text-primary-400">${loanAmount.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="1000"
                                max="100000"
                                step="1000"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Collateral Value</span>
                                <span className="font-mono text-primary-400">${collateral.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="1000"
                                max="200000"
                                step="1000"
                                value={collateral}
                                onChange={(e) => setCollateral(Number(e.target.value))}
                                className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Term (Months)</span>
                                <span className="font-mono text-primary-400">{term} months</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="24"
                                value={term}
                                onChange={(e) => setTerm(Number(e.target.value))}
                                className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>
                        <button
                            onClick={handleSimulate}
                            disabled={evaluating}
                            className="w-full py-2.5 bg-primary-500/10 border border-primary-500/30 rounded-lg text-primary-400 hover:bg-primary-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {evaluating ? 'Calculating...' : 'Run Simulation'}
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-surface-100/50 to-surface-50/50 rounded-xl p-4 border border-white/5 shadow-sm">
                        <span className="text-xs text-gray-500 mb-2">Projected Rate</span>
                        <span className="text-3xl font-mono font-bold text-primary-400">
                            {riskData?.interestRate?.toFixed(1) || (8 + (loanAmount / collateral) * 5 - term * 0.1).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-600 mt-2">APR</span>
                        {riskData && (
                            <div className="mt-4 text-center">
                                <span className="text-xs text-gray-500">Risk Level</span>
                                <div className={`text-sm font-medium ${riskData.riskLevel === 'VERY_LOW' || riskData.riskLevel === 'LOW' ? 'text-emerald-400' :
                                    riskData.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                                    }`}>
                                    {riskData.riskLevel}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function FraudDetectionTab({ isLoading }: { isLoading: boolean }) {
    const fraudFactors = [
        { name: 'Velocity Check', status: 'clear', description: 'Normal transaction frequency', risk: 5 },
        { name: 'Address Analysis', status: 'clear', description: 'No suspicious connections', risk: 8 },
        { name: 'Behavior Pattern', status: 'clear', description: 'Consistent with history', risk: 12 },
        { name: 'Sybil Detection', status: 'clear', description: 'Unique identity verified', risk: 3 },
        { name: 'Wash Trading', status: 'clear', description: 'No circular patterns', risk: 2 },
        { name: 'Flash Loan Risk', status: 'clear', description: 'No atomic exploits', risk: 1 },
    ];

    return (
        <div className="space-y-6">
            <MetricRow columns={4}>
                <MetricCard label="Fraud Score" value="0.02" subValue="/1.0" variant="highlight" isLoading={isLoading} />
                <MetricCard label="Risk Flags" value="0" variant="highlight" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} isLoading={isLoading} />
                <MetricCard label="Suspicious Patterns" value="None" isLoading={isLoading} />
                <MetricCard label="Last Check" value="2m ago" icon={<Activity className="w-4 h-4" />} isLoading={isLoading} />
            </MetricRow>

            <Panel title="Flag History" isLoading={isLoading}>
                <DataTable
                    data={[]}
                    columns={fraudColumns}
                    emptyMessage="No fraud flags detected - Your account is in good standing"
                />
            </Panel>

            <Panel title="Detection Factors" isLoading={isLoading}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fraudFactors.map((factor) => (
                        <Card key={factor.name}>
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-sm text-gray-400">{factor.name}</span>
                                {factor.status === 'clear' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : factor.status === 'warning' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                            </div>
                            <p className="text-xs text-gray-600">{factor.description}</p>
                            <div className="mt-2">
                                <RiskBar value={factor.risk} size="sm" showValue={false} />
                            </div>
                        </Card>
                    ))}
                </div>
            </Panel>
        </div>
    );
}

function EnsembleModelsTab({ isLoading }: { isLoading: boolean }) {
    const modelOutputs = [
        { model: 'XGBoost v2.1', prediction: 'Low Risk', probability: 0.12, confidence: 0.94, latency: '23ms' },
        { model: 'Random Forest', prediction: 'Low Risk', probability: 0.15, confidence: 0.89, latency: '31ms' },
        { model: 'Neural Network', prediction: 'Low Risk', probability: 0.11, confidence: 0.87, latency: '45ms' },
        { model: 'Logistic Regression', prediction: 'Low Risk', probability: 0.18, confidence: 0.82, latency: '8ms' },
    ];

    const agreementMatrix = [
        [1.0, 0.92, 0.88, 0.85],
        [0.92, 1.0, 0.86, 0.83],
        [0.88, 0.86, 1.0, 0.79],
        [0.85, 0.83, 0.79, 1.0],
    ];

    return (
        <div className="space-y-6">
            <Panel title="Model Output Comparison" isLoading={isLoading}>
                <DataTable
                    data={modelOutputs}
                    columns={modelColumns}
                />
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Agreement Matrix" isLoading={isLoading}>
                    <div className="grid grid-cols-5 gap-1 font-mono text-xs">
                        <div className="p-2" />
                        {['XGB', 'RF', 'NN', 'LR'].map((m) => (
                            <div key={m} className="p-2 text-center text-gray-400">{m}</div>
                        ))}
                        {agreementMatrix.map((row, i) => (
                            <>
                                <div key={`label-${i}`} className="p-2 text-gray-400">{['XGB', 'RF', 'NN', 'LR'][i]}</div>
                                {row.map((val, j) => (
                                    <div
                                        key={`${i}-${j}`}
                                        className={`p-2 text-center rounded ${val >= 0.9 ? 'bg-emerald-500/20 text-emerald-400' :
                                            val >= 0.7 ? 'bg-primary-500/20 text-primary-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}
                                    >
                                        {val.toFixed(2)}
                                    </div>
                                ))}
                            </>
                        ))}
                    </div>
                </Panel>

                <Panel title="Model Confidence" isLoading={isLoading}>
                    <div className="flex items-center justify-around py-4 flex-wrap gap-4">
                        <ConfidenceMeter value={0.94} label="XGBoost" />
                        <ConfidenceMeter value={0.89} label="Random Forest" />
                        <ConfidenceMeter value={0.87} label="Neural Net" />
                        <ConfidenceMeter value={0.82} label="Logistic Reg" />
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function PredictiveAnalyticsTab({ intelligenceData, isLoading }: { intelligenceData: any; isLoading: boolean }) {
    void intelligenceData;

    const defaultForecast = [
        { date: 'W1', value: 0.025, actual: true },
        { date: 'W2', value: 0.023, actual: true },
        { date: 'W3', value: 0.021, actual: true },
        { date: 'W4', value: 0.022, actual: true },
        { date: 'W5', value: 0.020, actual: false },
        { date: 'W6', value: 0.019, actual: false },
        { date: 'W7', value: 0.018, actual: false },
        { date: 'W8', value: 0.017, actual: false },
    ];

    const riskTrajectory = [
        { label: 'Default Risk', current: '2.3%', forecast: '1.8%', direction: 'improving' },
        { label: 'Liquidation Risk', current: '5.1%', forecast: '4.2%', direction: 'improving' },
        { label: 'Collateral Volatility', current: '12%', forecast: '15%', direction: 'worsening' },
    ];

    return (
        <div className="space-y-6">
            <MetricRow columns={3}>
                <MetricCard
                    label="Default Forecast (30d)"
                    value="2.1%"
                    trend="down"
                    trendValue="-0.3%"
                    variant="highlight"
                    isLoading={isLoading}
                />
                <MetricCard
                    label="Churn Probability"
                    value="8.4%"
                    trend="neutral"
                    trendValue="stable"
                    isLoading={isLoading}
                />
                <MetricCard
                    label="Market Outlook"
                    value="Bullish"
                    subValue="72% confidence"
                    icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                    isLoading={isLoading}
                />
            </MetricRow>

            {/* Insights Section */}
            {intelligenceData?.insights && intelligenceData.insights.length > 0 && (
                <Panel title="AI Insights" isLoading={isLoading}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {intelligenceData.insights.map((insight: any) => (
                            <Card key={insight.id}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded ${insight.type === 'opportunity' ? 'bg-emerald-500/10' :
                                        insight.type === 'warning' ? 'bg-amber-500/10' : 'bg-primary-500/10'
                                        }`}>
                                        {insight.type === 'opportunity' ? (
                                            <Lightbulb className="w-4 h-4 text-emerald-400" />
                                        ) : insight.type === 'warning' ? (
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <Target className="w-4 h-4 text-primary-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-300">{insight.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${insight.impact === 'high' ? 'bg-rose-500/10 text-rose-400' :
                                                insight.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                {insight.impact}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
                                        {insight.actionable && (
                                            <button className="mt-2 text-xs px-3 py-1 bg-surface-100/50 border border-white/10 rounded hover:border-primary-500/30 text-gray-400 hover:text-primary-400 transition-colors">
                                                Take Action
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Panel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Default Probability Forecast" isLoading={isLoading}>
                    <div className="h-48 flex items-end justify-between gap-1 px-4">
                        {defaultForecast.map((point, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                <div
                                    className={`w-full rounded-t transition-colors cursor-pointer ${point.actual ? 'bg-cyan-500/50' : 'bg-amber-500/30 border border-dashed border-amber-500/50'
                                        }`}
                                    style={{ height: `${point.value * 500}px` }}
                                    title={`${point.date}: ${(point.value * 100).toFixed(1)}%`}
                                />
                                <span className="text-xs text-gray-600">{point.date}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-cyan-500/50 rounded" />
                            <span className="text-gray-500">Actual</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-500/30 border border-dashed border-amber-500/50 rounded" />
                            <span className="text-gray-500">Forecast</span>
                        </span>
                    </div>
                </Panel>

                <Panel title="Risk Trajectory" isLoading={isLoading}>
                    <div className="space-y-4">
                        {riskTrajectory.map((item) => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{item.label}</span>
                                    <span className="font-mono text-gray-200">{item.current} → {item.forecast}</span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="flex-1 h-2 bg-cyan-500/30 rounded-l" />
                                    <div
                                        className={`h-2 rounded-r ${item.direction === 'improving' ? 'bg-green-500/50' : 'bg-red-500/50'
                                            }`}
                                        style={{ width: '30%' }}
                                    />
                                </div>
                                <span className={`text-xs ${item.direction === 'improving' ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.direction === 'improving' ? '↓ Improving' : '↑ Worsening'}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

const fraudColumns = [
    { key: 'id', header: 'Flag ID' },
    { key: 'date', header: 'Date' },
    { key: 'type', header: 'Type' },
    { key: 'severity', header: 'Severity' },
    { key: 'status', header: 'Status' },
    { key: 'resolution', header: 'Resolution' },
];

const modelColumns = [
    { key: 'model', header: 'Model' },
    { key: 'prediction', header: 'Prediction' },
    {
        key: 'probability', header: 'Prob', align: 'right' as const, render: (row: { probability: number }) => (
            <span className="font-mono">{(row.probability * 100).toFixed(1)}%</span>
        )
    },
    {
        key: 'confidence', header: 'Confidence', align: 'right' as const, render: (row: { confidence: number }) => (
            <span className="font-mono text-cyan-400">{(row.confidence * 100).toFixed(0)}%</span>
        )
    },
    { key: 'latency', header: 'Latency', align: 'right' as const },
];
