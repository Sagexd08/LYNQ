import { motion } from 'framer-motion';
import { Activity, Fuel, Clock, TrendingUp, Zap, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PulseMetric {
    icon: React.ElementType;
    label: string;
    value: string;
    change?: string;
    positive?: boolean;
}

export const PulseBar = () => {
    const [metrics, setMetrics] = useState<PulseMetric[]>([
        { icon: Fuel, label: 'Gas', value: '12 gwei', change: '-8%', positive: true },
        { icon: Clock, label: 'Block', value: '2.1s', change: '+0.1s', positive: false },
        { icon: TrendingUp, label: 'TVL', value: '$12.4M', change: '+2.3%', positive: true },
        { icon: Activity, label: 'TPS', value: '847', change: '+12%', positive: true },
        { icon: Zap, label: 'Loans/24h', value: '234', change: '+18%', positive: true },
    ]);

    const [pulseIndex, setPulseIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPulseIndex((prev) => (prev + 1) % metrics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [metrics.length]);

    useEffect(() => {
        const updateInterval = setInterval(() => {
            setMetrics((prev) =>
                prev.map((metric) => {
                    if (metric.label === 'Gas') {
                        const newGas = Math.floor(10 + Math.random() * 15);
                        return { ...metric, value: `${newGas} gwei` };
                    }
                    if (metric.label === 'TPS') {
                        const newTps = Math.floor(800 + Math.random() * 100);
                        return { ...metric, value: newTps.toString() };
                    }
                    return metric;
                })
            );
        }, 5000);
        return () => clearInterval(updateInterval);
    }, []);

    return (
        <div className="w-full bg-lynq-darker/80 backdrop-blur-xl border-b border-glass-border/30">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex items-center justify-between h-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [1, 0.7, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="w-2 h-2 rounded-full bg-success"
                            />
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Network Live
                            </span>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-glass-border" />
                        <div className="hidden sm:flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-neon-cyan" />
                            <span className="text-[10px] text-gray-500">Mantle Sepolia</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-none">
                        {metrics.map((metric, index) => (
                            <motion.div
                                key={metric.label}
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: pulseIndex === index ? 1 : 0.7,
                                    scale: pulseIndex === index ? 1.02 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2 whitespace-nowrap"
                            >
                                <metric.icon
                                    className={`w-3.5 h-3.5 ${pulseIndex === index ? 'text-neon-cyan' : 'text-gray-500'
                                        } transition-colors`}
                                />
                                <span className="text-[11px] text-gray-500">{metric.label}:</span>
                                <span className="text-[11px] font-medium text-white font-metrics">
                                    {metric.value}
                                </span>
                                {metric.change && (
                                    <span
                                        className={`text-[10px] font-medium ${metric.positive ? 'text-success' : 'text-error'
                                            }`}
                                    >
                                        {metric.change}
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PulseBar;
