import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Shield,
    TrendingDown,
    Activity,
    Target,
    Gauge,
    Bell,
    BarChart2,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';

const RiskPage = () => {
    const riskMetrics = [
        { label: 'Overall Risk Score', value: '72', status: 'Low', color: 'success', icon: Shield },
        { label: 'Health Factor', value: '1.85', status: 'Healthy', color: 'neon-cyan', icon: Activity },
        { label: 'Liquidation Risk', value: '12%', status: 'Low', color: 'success', icon: TrendingDown },
        { label: 'Portfolio Volatility', value: '24%', status: 'Medium', color: 'warning', icon: Gauge },
    ];

    const riskAlerts = [
        {
            id: 1,
            type: 'warning',
            title: 'Health Factor Approaching Threshold',
            description: 'Position 0x3f...8a2d health factor is at 1.15',
            time: '2 hours ago',
            action: 'Add Collateral',
        },
        {
            id: 2,
            type: 'info',
            title: 'Market Volatility Alert',
            description: 'ETH price movement exceeded 5% in 24h',
            time: '4 hours ago',
            action: 'Review Position',
        },
        {
            id: 3,
            type: 'success',
            title: 'Risk Assessment Complete',
            description: 'All positions reviewed and scored',
            time: '6 hours ago',
            action: 'View Report',
        },
    ];

    const riskFactors = [
        { factor: 'Collateral Quality', score: 88, weight: 30 },
        { factor: 'Loan-to-Value Ratio', score: 75, weight: 25 },
        { factor: 'Market Conditions', score: 68, weight: 20 },
        { factor: 'Payment History', score: 95, weight: 15 },
        { factor: 'Wallet Age & Activity', score: 82, weight: 10 },
    ];

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'info':
                return <AlertCircle className="w-5 h-5 text-info" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-success" />;
            default:
                return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-lynq-darker pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-warning/20 to-error/20 border border-warning/30">
                            <AlertTriangle className="w-8 h-8 text-warning" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-heading font-bold text-white">Risk Analysis</h1>
                            <p className="text-gray-400 mt-1">Monitor and manage your portfolio risk exposure</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {riskMetrics.map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl p-6 border border-glass-border hover:border-neon-cyan/30 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl bg-${metric.color}/10`}>
                                    <metric.icon className={`w-5 h-5 text-${metric.color}`} />
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${metric.color}/20 text-${metric.color}`}>
                                    {metric.status}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-white font-metrics">{metric.value}</p>
                            <p className="text-sm text-gray-400 mt-1">{metric.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden"
                    >
                        <div className="p-6 border-b border-glass-border/50">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-neon-cyan" />
                                Risk Score Breakdown
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {riskFactors.map((factor, index) => (
                                <motion.div
                                    key={factor.factor}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">{factor.factor}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{factor.weight}% weight</span>
                                            <span className="text-sm font-bold text-white">{factor.score}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-glass-white/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${factor.score}%` }}
                                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                                            className={`h-full rounded-full ${factor.score >= 80
                                                    ? 'bg-gradient-to-r from-success to-neon-cyan'
                                                    : factor.score >= 60
                                                        ? 'bg-gradient-to-r from-warning to-amber-400'
                                                        : 'bg-gradient-to-r from-error to-red-400'
                                                }`}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden"
                    >
                        <div className="p-6 border-b border-glass-border/50 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-neon-cyan" />
                                Risk Alerts
                            </h2>
                            <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
                                {riskAlerts.length} active
                            </span>
                        </div>
                        <div className="divide-y divide-glass-border/30">
                            {riskAlerts.map((alert, index) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                    className="p-4 hover:bg-glass-white/20 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{alert.title}</h3>
                                            <p className="text-sm text-gray-400 mt-0.5">{alert.description}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {alert.time}
                                                </span>
                                                <button className="text-xs font-medium text-neon-cyan hover:text-white transition-colors">
                                                    {alert.action}
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
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-8 bg-lynq-card/60 backdrop-blur-xl rounded-2xl border border-glass-border p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart2 className="w-5 h-5 text-neon-cyan" />
                        <h2 className="text-xl font-semibold text-white">Risk Trend</h2>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-2 px-4">
                        {[65, 72, 68, 75, 70, 78, 72].map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ height: 0 }}
                                animate={{ height: `${value}%` }}
                                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                                className="flex-1 bg-gradient-to-t from-neon-cyan/20 to-neon-cyan/60 rounded-t-lg relative group cursor-pointer"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-lynq-dark text-white text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {value}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 px-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <span key={day} className="text-xs text-gray-500 flex-1 text-center">
                                {day}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RiskPage;
