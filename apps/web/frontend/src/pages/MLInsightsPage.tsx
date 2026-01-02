import React from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Activity,
    Info,
    Layers,
    TrendingUp,
} from 'lucide-react';
import { ConfidenceRing } from '../components/lynq/ConfidenceRing';

const MLInsightsPage: React.FC = () => {
    const container = {
        show: { transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                {}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-premium-violet" />
                        <span className="text-[10px] font-metrics tracking-[0.2em] text-gray-500 uppercase font-bold">Explainability Theatre v1.0</span>
                    </div>
                    <h1 className="text-4xl font-heading font-bold tracking-tight mb-4">Intelligence Breakdown</h1>
                    <p className="text-gray-400 max-w-2xl leading-relaxed font-metrics text-xs uppercase tracking-wider">
                        Radical transparency for on-chain risk. We expose the weights and biases of our models
                        so you can borrow with institutional-grade confidence.
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid lg:grid-cols-12 gap-6"
                >
                    {}
                    <motion.div variants={item} className="lg:col-span-4 h-full">
                        <div className="h-full p-8 rounded-2xl bg-[#0F1115] border border-white/5">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-lg font-bold font-heading">Factor Weights</h3>
                                <Layers className="w-4 h-4 text-gray-500" />
                            </div>

                            <div className="flex justify-center mb-10 relative">
                                <ConfidenceRing value={748} size={200} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                    <div className="w-full h-px bg-white/20 rotate-45" />
                                    <div className="w-full h-px bg-white/20 -rotate-45" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Repayment History", weight: 35, color: "bg-neon-cyan" },
                                    { label: "Liquidity Depth", weight: 25, color: "bg-white" },
                                    { label: "Protocol Tenure", weight: 20, color: "bg-premium-violet" },
                                    { label: "Anomaly Score", weight: 20, color: "bg-risk-amber" }
                                ].map(f => (
                                    <div key={f.label} className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-metrics">{f.label}</span>
                                            <span className="text-[10px] font-bold font-metrics">{f.weight}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${f.color}`} style={{ width: `${f.weight}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {}
                    <motion.div variants={item} className="lg:col-span-8">
                        <div className="p-8 rounded-2xl bg-[#0F1115] border border-white/5 h-full">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-bold font-heading">Ensemble Agreement</h3>
                                    <p className="text-[10px] text-gray-500 font-metrics uppercase tracking-wider mt-1">Cross-model verification status</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                                        <span className="text-[10px] font-metrics text-gray-400">Stable</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-risk-amber" />
                                        <span className="text-[10px] font-metrics text-gray-400">Outlier</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[250px] flex items-end gap-4 pb-4">
                                {[85, 92, 78, 96, 88, 94, 91, 89, 95, 92].map((v, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${v}%` }}
                                            transition={{ delay: i * 0.05, duration: 1 }}
                                            className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t ${i === 3 ? 'from-premium-violet to-neon-cyan opacity-100' : 'from-white/5 to-white/10 opacity-50'}`}
                                        />
                                        <span className="text-[8px] font-metrics text-gray-600">M{i + 1}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 grid md:grid-cols-3 gap-8">
                                <div>
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Standard Deviation</span>
                                    <span className="text-xl font-bold font-metrics">0.042</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Consensus Grade</span>
                                    <span className="text-xl font-bold font-metrics text-neon-cyan">PLATINUM</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Model Drift</span>
                                    <span className="text-xl font-bold font-metrics">NEG{'>'}0.01%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {}
                    <motion.div variants={item} className="lg:col-span-12">
                        <div className="p-8 rounded-2xl bg-[#0F1115] border border-white/5">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-bold font-heading">Anomaly Timeline</h3>
                                <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
                            </div>

                            <div className="relative pt-8 pb-12">
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />
                                <div className="grid grid-cols-6 gap-4 relative z-10">
                                    {[
                                        { date: "DEC 15", event: "Standard Activity", status: "safe" },
                                        { date: "DEC 20", event: "Large Deposit", status: "safe" },
                                        { date: "DEC 22", event: "Anomaly Pattern", status: "warning" },
                                        { date: "DEC 24", event: "Pattern Resolved", status: "safe" },
                                        { date: "DEC 28", event: "Standard Activity", status: "safe" },
                                        { date: "TODAY", event: "Operational", status: "safe" },
                                    ].map((t, i) => (
                                        <div key={i} className="flex flex-col items-center gap-4">
                                            <span className="text-[10px] text-gray-600 font-metrics">{t.date}</span>
                                            <div className={`w-3 h-3 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(34,211,238,0.2)] ${t.status === 'warning' ? 'bg-risk-amber' : 'bg-neon-cyan'}`} />
                                            <div className="text-center">
                                                <span className="block text-[10px] text-white font-bold font-metrics uppercase">{t.event}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-start gap-3">
                                <Info className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-gray-400 font-metrics tracking-wider leading-relaxed">
                                    UX NOTE: NO ANOMALIES DETECTED IN THE LAST 96 HOURS. THE SYSTEM HAS ANALYZED 4,281 TRANSACTION VECTORS
                                    AND FOUND NO CORRELATION WITH KNOWN FRAUDULENT PATTERNS.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {}
                    <motion.div variants={item} className="lg:col-span-12">
                        <div className="p-8 rounded-2xl bg-gradient-to-r from-neon-cyan/5 to-transparent border border-white/5 overflow-hidden relative">
                            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                                <div className="w-full md:w-1/3">
                                    <h3 className="text-2xl font-heading font-black italic tracking-tighter mb-4 uppercase">90-Day Forecast</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 font-metrics uppercase tracking-widest">
                                        Predictive bands based on on-chain liquidity depth and external market volatility.
                                    </p>
                                    <div className="flex items-center gap-2 text-neon-cyan">
                                        <TrendingUp className="w-5 h-5" />
                                        <span className="text-lg font-bold font-metrics">+12% CREDIT GROWTH</span>
                                    </div>
                                </div>

                                <div className="flex-1 w-full h-[150px] relative">
                                    <svg width="100%" height="150" className="overflow-visible">
                                        <defs>
                                            <linearGradient id="bandGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.1" />
                                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
                                            </linearGradient>
                                        </defs>
                                        {}
                                        <path
                                            d="M0 75 Q 100 20, 200 80 T 400 40 T 600 90 T 800 50 L 800 120 Q 600 150, 400 100 T 200 140 T 0 110 Z"
                                            fill="url(#bandGradient)"
                                        />
                                        {}
                                        <path
                                            d="M0 92 Q 100 37, 200 97 T 400 57 T 600 107 T 800 67"
                                            fill="none"
                                            stroke="#22D3EE"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                        />
                                    </svg>
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="text-[10px] text-neon-cyan font-bold font-metrics uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-neon-cyan/20">
                                            95% Confidence Interval
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default MLInsightsPage;
