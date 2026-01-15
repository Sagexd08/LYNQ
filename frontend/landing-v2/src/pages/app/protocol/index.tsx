import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard, MetricRow } from '@/components/ui/MetricCard';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { Section, Panel, Card } from '@/components/ui/Section';
import { dashboardApi } from '@/lib/api';
import {
    FileCode2,
    ExternalLink,
    Copy,
    CheckCircle,
    Coins,
    Lock,
    Unlock,
    Activity,
} from 'lucide-react';

type Tab = 'explorer' | 'lifecycle';

export default function ProtocolPage() {
    const [activeTab, setActiveTab] = useState<Tab>('explorer');

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 bg-[#0d0d0f] border border-[#1f1f25] rounded">
                    <button
                        onClick={() => setActiveTab('explorer')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${activeTab === 'explorer'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]'
                            }`}
                    >
                        <FileCode2 className="w-4 h-4" />
                        Contract Explorer
                    </button>
                    <button
                        onClick={() => setActiveTab('lifecycle')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${activeTab === 'lifecycle'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]'
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Loan Lifecycle
                    </button>
                </div>

                {activeTab === 'explorer' && <ContractExplorerTab />}
                {activeTab === 'lifecycle' && <LoanLifecycleTab />}
            </div>
        </AppShell>
    );
}

function ContractExplorerTab() {
    const [copied, setCopied] = useState(false);
    const [contracts, setContracts] = useState<Array<{
        name: string;
        address: string;
        balance: string;
        txCount: string;
        gasUsed: string;
        version: string;
        deployed: string;
    }>>([]);
    const [contractEvents, setContractEvents] = useState<Array<{
        event: string;
        contract: string;
        txHash: string;
        block: string;
        time: string;
    }>>([]);
    const [protocolStats, setProtocolStats] = useState({
        totalContracts: 0,
        totalValueLocked: 0,
        totalTransactions: 0,
        gasSaved: 0,
    });

    useEffect(() => {
        // Fetch protocol stats
        dashboardApi.getProtocolStats().then((stats) => {
            setProtocolStats({
                totalContracts: 0, // TODO: Add to API response
                totalValueLocked: stats.totalValueLocked,
                totalTransactions: 0, // TODO: Add to API response
                gasSaved: 0, // TODO: Add to API response
            });
        });

        // TODO: Fetch contract addresses from API or environment variables
        // For now, using empty array - contracts will be populated from API when available
        setContracts([]);
        setContractEvents([]);
    }, []);

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            {/* Contract Overview */}
            <MetricRow columns={4}>
                <MetricCard label="Total Contracts" value={protocolStats.totalContracts.toString()} />
                <MetricCard 
                    label="Total Value Locked" 
                    value={formatCurrency(protocolStats.totalValueLocked)} 
                    variant="highlight" 
                />
                <MetricCard label="Total Transactions" value={protocolStats.totalTransactions.toLocaleString()} />
                <MetricCard label="Gas Saved (30d)" value={`${protocolStats.gasSaved.toFixed(2)} ETH`} />
            </MetricRow>

            {/* Contracts List */}
            <Section title="Deployed Contracts">
                <div className="space-y-4">
                    {contracts.length > 0 ? (
                        contracts.map((contract) => (
                        <Card key={contract.name} hover>
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-medium text-gray-200">{contract.name}</span>
                                        <StatusBadge status="active" label="Verified" />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-mono text-cyan-400">{contract.address}</span>
                                        <button
                                            onClick={() => copyAddress(contract.address)}
                                            className="p-1 hover:bg-[#1a1a1f] rounded"
                                        >
                                            {copied ? (
                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-gray-500" />
                                            )}
                                        </button>
                                        <a
                                            href={`https://etherscan.io/address/${contract.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-[#1a1a1f] rounded"
                                        >
                                            <ExternalLink className="w-3 h-3 text-gray-500" />
                                        </a>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-mono text-gray-200">{contract.balance}</div>
                                    <div className="text-xs text-gray-500">Balance</div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#1f1f25] grid grid-cols-4 gap-4">
                                <div>
                                    <span className="text-xs text-gray-500">Transactions</span>
                                    <div className="font-mono text-gray-300">{contract.txCount}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Gas Used (24h)</span>
                                    <div className="font-mono text-gray-300">{contract.gasUsed}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Version</span>
                                    <div className="font-mono text-gray-300">{contract.version}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Deployed</span>
                                    <div className="font-mono text-gray-300">{contract.deployed}</div>
                                </div>
                            </div>
                        </Card>
                        ))
                    ) : (
                        <Card>
                            <p className="text-sm text-gray-500 text-center py-8">
                                No contracts available. Contract addresses will be displayed when available.
                            </p>
                        </Card>
                    )}
                </div>
            </Section>

            {/* Recent Events */}
            <Panel title="Recent Contract Events" noPadding>
                {contractEvents.length > 0 ? (
                    <DataTable
                        data={contractEvents}
                        columns={eventColumns}
                        compact
                    />
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-500">No recent events available</p>
                    </div>
                )}
            </Panel>
        </div>
    );
}

function LoanLifecycleTab() {
    const [currentStep] = useState(1);
    const [stepHistory, setStepHistory] = useState<Array<{
        step: string;
        status: 'complete' | 'active';
        time: string;
        details: string;
    }>>([]);

    useEffect(() => {
        // TODO: Fetch loan lifecycle data from API
        // For now, using empty state
        setStepHistory([]);
    }, []);

    const steps = [
        { id: 1, name: 'Application', icon: FileCode2, description: 'Loan request submitted' },
        { id: 2, name: 'ML Evaluation', icon: Activity, description: 'Risk assessment complete' },
        { id: 3, name: 'Collateral Lock', icon: Lock, description: 'Assets locked in vault' },
        { id: 4, name: 'Activation', icon: CheckCircle, description: 'Loan funds released' },
        { id: 5, name: 'Repayment', icon: Coins, description: 'Payments in progress' },
        { id: 6, name: 'Close/Liquidation', icon: Unlock, description: 'Final settlement' },
    ];

    return (
        <div className="space-y-6">
            {/* Lifecycle Visualizer */}
            <Panel title="Loan L-2847 Lifecycle">
                <div className="py-8">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 right-0 h-0.5 bg-[#1f1f25]">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isActive = step.id === currentStep;
                            const isComplete = step.id < currentStep;

                            return (
                                <div key={step.id} className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${isComplete
                                            ? 'bg-cyan-500 border-cyan-500 text-white'
                                            : isActive
                                                ? 'bg-[#0d0d0f] border-cyan-500 text-cyan-400'
                                                : 'bg-[#0d0d0f] border-[#1f1f25] text-gray-600'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span
                                        className={`mt-3 text-sm font-medium ${isActive ? 'text-cyan-400' : isComplete ? 'text-gray-300' : 'text-gray-600'
                                            }`}
                                    >
                                        {step.name}
                                    </span>
                                    <span className="text-xs text-gray-600 mt-1 max-w-[100px] text-center">
                                        {step.description}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Panel>

            {/* Current Step Details */}
            <div className="grid grid-cols-2 gap-4">
                <Panel title="Current Step: Collateral Lock">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Status</span>
                            <StatusBadge status="active" label="In Progress" />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Collateral Type</span>
                            <span className="font-mono text-gray-200">ETH</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Amount Required</span>
                            <span className="font-mono text-cyan-400">2.5 ETH</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Amount Locked</span>
                            <span className="font-mono text-green-400">2.5 ETH</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Vault Address</span>
                            <span className="font-mono text-gray-400">0x7a3b...4c5d</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Lock Time</span>
                            <span className="font-mono text-gray-200">2 minutes ago</span>
                        </div>
                    </div>
                </Panel>

                <Panel title="Step History">
                    <div className="space-y-3">
                        {stepHistory.length > 0 ? (
                            stepHistory.map((event, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 p-3 bg-[#111114] rounded border border-[#1f1f25]"
                                >
                                    <div className={`w-2 h-2 mt-1.5 rounded-full ${event.status === 'complete' ? 'bg-green-400' : 'bg-cyan-400'
                                        }`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">{event.step}</span>
                                            <span className="text-xs text-gray-600">{event.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No history available</p>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

const eventColumns = [
    {
        key: 'event', header: 'Event', render: (row: { event: string; contract: string; txHash: string; block: string; time: string }) => (
            <span className="text-cyan-400">{row.event}</span>
        )
    },
    { key: 'contract', header: 'Contract' },
    {
        key: 'txHash', header: 'TX Hash', render: (row: { event: string; contract: string; txHash: string; block: string; time: string }) => (
            <span className="font-mono text-gray-400">{row.txHash}</span>
        )
    },
    {
        key: 'block', header: 'Block', align: 'right' as const, render: (row: { event: string; contract: string; txHash: string; block: string; time: string }) => (
            <span className="font-mono">{row.block}</span>
        )
    },
    { key: 'time', header: 'Time', align: 'right' as const },
];
