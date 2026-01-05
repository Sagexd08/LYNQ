import { motion } from 'framer-motion';
import {
    Shield,
    Activity,
    TrendingUp,
    Layers,
    Lock,
    Globe,
    Zap,
    BarChart3,
    ArrowUpRight,
    CheckCircle,
} from 'lucide-react';

const ProtocolPage = () => {
    const protocolStats = [
        { label: 'Total Value Locked', value: '$12.4M', change: '+12.3%', icon: Lock, color: 'neon-cyan' },
        { label: 'Active Loans', value: '1,234', change: '+8.7%', icon: Activity, color: 'success' },
        { label: 'Total Users', value: '5,678', change: '+15.2%', icon: Globe, color: 'electric-blue' },
        { label: 'Protocol Revenue', value: '$234K', change: '+22.1%', icon: TrendingUp, color: 'deep-purple' },
    ];

    const protocolFeatures = [
        {
            icon: Shield,
            title: 'Multi-Sig Security',
            description: 'All protocol operations are protected by multi-signature wallets',
            status: 'Active',
        },
        {
            icon: Zap,
            title: 'Flash Loan Protection',
            description: 'Built-in safeguards against flash loan exploits',
            status: 'Active',
        },
        {
            icon: Layers,
            title: 'Cross-Chain Support',
            description: 'Seamless integration with multiple blockchain networks',
            status: 'Active',
        },
        {
            icon: BarChart3,
            title: 'ML Risk Scoring',
            description: 'Advanced algorithmic risk assessment for all loans',
            status: 'Active',
        },
    ];

    const recentUpdates = [
        { version: 'v2.1.0', title: 'Enhanced Risk Engine', date: '2 days ago' },
        { version: 'v2.0.5', title: 'Gas Optimization Update', date: '1 week ago' },
        { version: 'v2.0.4', title: 'Multi-Chain Integration', date: '2 weeks ago' },
    ];

    return (
        <div className="min-h-screen bg-lynq-darker pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-electric-blue/20 border border-neon-cyan/30">
                            <Shield className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-heading font-bold text-white">Protocol</h1>
                            <p className="text-gray-400 mt-1">LYNQ DeFi Protocol Overview & Statistics</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {protocolStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl p-6 border border-glass-border hover:border-neon-cyan/30 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl bg-${stat.color}/10`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                                </div>
                                <span className="text-xs font-medium text-success flex items-center gap-1">
                                    {stat.change}
                                    <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white font-metrics">{stat.value}</p>
                            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden"
                        >
                            <div className="p-6 border-b border-glass-border/50">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-neon-cyan" />
                                    Protocol Features
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {protocolFeatures.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                        className="p-4 rounded-xl bg-glass-white/30 border border-glass-border/50 hover:border-neon-cyan/20 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-neon-cyan/10">
                                                <feature.icon className="w-4 h-4 text-neon-cyan" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-white">{feature.title}</h3>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success font-medium flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {feature.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
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
                                <Activity className="w-5 h-5 text-neon-cyan" />
                                Recent Updates
                            </h2>
                        </div>
                        <div className="p-4">
                            {recentUpdates.map((update, index) => (
                                <motion.div
                                    key={update.version}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    className="p-4 rounded-xl hover:bg-glass-white/30 transition-all cursor-pointer border-b border-glass-border/30 last:border-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono px-2 py-1 rounded bg-electric-blue/20 text-electric-blue">
                                            {update.version}
                                        </span>
                                        <span className="text-xs text-gray-500">{update.date}</span>
                                    </div>
                                    <p className="text-sm font-medium text-white mt-2">{update.title}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-8 bg-gradient-to-r from-neon-cyan/10 via-electric-blue/10 to-deep-purple/10 rounded-2xl p-8 border border-glass-border"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Ready to build on LYNQ?</h2>
                            <p className="text-gray-400 mt-2">
                                Explore our developer documentation and start integrating with the protocol.
                            </p>
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-all flex items-center gap-2">
                            View Documentation
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProtocolPage;
