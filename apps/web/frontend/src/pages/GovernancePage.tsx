import { motion } from 'framer-motion';
import {
    Vote,
    Users,
    Scale,
    Trophy,
    Clock,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    Coins,
    FileText,
    Sparkles,
} from 'lucide-react';

const GovernancePage = () => {
    const governanceStats = [
        { label: 'Total Proposals', value: '47', icon: FileText, color: 'neon-cyan' },
        { label: 'Active Votes', value: '3', icon: Vote, color: 'warning' },
        { label: 'Token Holders', value: '2,341', icon: Users, color: 'electric-blue' },
        { label: 'Treasury Value', value: '$2.8M', icon: Coins, color: 'success' },
    ];

    const proposals = [
        {
            id: 'LIP-047',
            title: 'Increase Flash Loan Fee to 0.15%',
            status: 'active',
            votesFor: 78,
            votesAgainst: 22,
            endsIn: '2 days',
            quorum: 65,
        },
        {
            id: 'LIP-046',
            title: 'Add Support for Arbitrum Network',
            status: 'active',
            votesFor: 92,
            votesAgainst: 8,
            endsIn: '4 days',
            quorum: 85,
        },
        {
            id: 'LIP-045',
            title: 'Reduce Minimum Collateral Ratio',
            status: 'active',
            votesFor: 45,
            votesAgainst: 55,
            endsIn: '6 days',
            quorum: 52,
        },
    ];

    const pastProposals = [
        { id: 'LIP-044', title: 'Protocol Fee Distribution Update', status: 'passed', date: '3 days ago' },
        { id: 'LIP-043', title: 'Add wBTC as Collateral Asset', status: 'passed', date: '1 week ago' },
        { id: 'LIP-042', title: 'Emergency Oracle Update', status: 'rejected', date: '2 weeks ago' },
    ];

    const userVotingPower = 12450;
    const delegatedPower = 3200;

    return (
        <div className="min-h-screen bg-lynq-darker pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-deep-purple/20 to-electric-blue/20 border border-deep-purple/30">
                            <Scale className="w-8 h-8 text-deep-purple" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-heading font-bold text-white">Governance</h1>
                            <p className="text-gray-400 mt-1">Participate in LYNQ protocol governance</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {governanceStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl p-6 border border-glass-border hover:border-neon-cyan/30 transition-all"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl bg-${stat.color}/10`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                                </div>
                                <span className="text-sm text-gray-400">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white font-metrics">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 bg-gradient-to-r from-deep-purple/10 via-electric-blue/10 to-neon-cyan/10 rounded-2xl p-6 border border-glass-border"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-glass-white/20">
                                <Trophy className="w-8 h-8 text-neon-cyan" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Your Voting Power</p>
                                <p className="text-3xl font-bold text-white font-metrics">{userVotingPower.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">+ {delegatedPower.toLocaleString()} delegated</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2.5 rounded-xl bg-glass-white/30 text-white font-medium hover:bg-glass-white/50 transition-all border border-glass-border">
                                Delegate
                            </button>
                            <button className="px-4 py-2.5 rounded-xl bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-all flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Create Proposal
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden"
                        >
                            <div className="p-6 border-b border-glass-border/50 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <Vote className="w-5 h-5 text-neon-cyan" />
                                    Active Proposals
                                </h2>
                                <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
                                    {proposals.length} active
                                </span>
                            </div>
                            <div className="divide-y divide-glass-border/30">
                                {proposals.map((proposal, index) => (
                                    <motion.div
                                        key={proposal.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                        className="p-6 hover:bg-glass-white/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-xs font-mono px-2 py-1 rounded bg-electric-blue/20 text-electric-blue">
                                                    {proposal.id}
                                                </span>
                                                <h3 className="font-medium text-white mt-2">{proposal.title}</h3>
                                            </div>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Ends in {proposal.endsIn}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-success">For: {proposal.votesFor}%</span>
                                                <span className="text-error">Against: {proposal.votesAgainst}%</span>
                                            </div>
                                            <div className="h-2 bg-glass-white/30 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-success"
                                                    style={{ width: `${proposal.votesFor}%` }}
                                                />
                                                <div
                                                    className="h-full bg-error"
                                                    style={{ width: `${proposal.votesAgainst}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Quorum: {proposal.quorum}%</span>
                                                <div className="flex gap-2">
                                                    <button className="text-xs px-3 py-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-all font-medium">
                                                        Vote For
                                                    </button>
                                                    <button className="text-xs px-3 py-1.5 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-all font-medium">
                                                        Vote Against
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden"
                    >
                        <div className="p-6 border-b border-glass-border/50">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-neon-cyan" />
                                Past Proposals
                            </h2>
                        </div>
                        <div className="divide-y divide-glass-border/30">
                            {pastProposals.map((proposal, index) => (
                                <motion.div
                                    key={proposal.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    className="p-4 hover:bg-glass-white/20 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-mono text-gray-500">{proposal.id}</span>
                                        <span className="text-xs text-gray-500">{proposal.date}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-white">{proposal.title}</p>
                                        {proposal.status === 'passed' ? (
                                            <CheckCircle className="w-4 h-4 text-success" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-error" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-glass-border/50 bg-lynq-darker/50">
                            <button className="w-full text-center text-sm text-neon-cyan hover:text-white transition-colors font-medium flex items-center justify-center gap-2">
                                View All Proposals
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default GovernancePage;
