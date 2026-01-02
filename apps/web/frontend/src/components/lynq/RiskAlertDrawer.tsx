import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, X, ChevronRight, Info } from 'lucide-react';

interface Alert {
    id: string;
    type: 'risk' | 'fraud' | 'info';
    title: string;
    message: string;
    timestamp: string;
}

export const RiskAlertDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts] = useState<Alert[]>([
        {
            id: '1',
            type: 'risk',
            title: 'Health Factor Warning',
            message: 'Position 0x...4a2 is approaching liquidation threshold (1.25 HF).',
            timestamp: '2m ago'
        },
        {
            id: '2',
            type: 'fraud',
            title: 'Anomaly Detected',
            message: 'Unusual withdrawal pattern detected on linked account.',
            timestamp: '15m ago'
        }
    ]);

    const toggleDrawer = () => setIsOpen(!isOpen);

    return (
        <>
            {}
            <div className="fixed top-24 right-6 z-[60]">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleDrawer}
                    className={`relative p-3 rounded-2xl border transition-all duration-500 shadow-2xl backdrop-blur-xl ${alerts.length > 0
                        ? 'bg-critical-red/10 border-critical-red/30 text-critical-red animate-pulse'
                        : 'bg-[#0F1115]/80 border-white/5 text-gray-400'
                        }`}
                >
                    {alerts.length > 0 ? <ShieldAlert className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    {alerts.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-critical-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#050505]">
                            {alerts.length}
                        </span>
                    )}
                </motion.button>
            </div>

            {}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleDrawer}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0F1115] border-l border-white/5 z-[80] shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-xl font-heading font-bold text-white">Risk Intelligence</h3>
                                    <p className="text-[10px] font-metrics text-gray-500 uppercase tracking-widest mt-1">Real-time surveillance</p>
                                </div>
                                <button onClick={toggleDrawer} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {alerts.length > 0 ? alerts.map((alert) => (
                                    <motion.div
                                        key={alert.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-5 rounded-2xl border transition-all ${alert.type === 'fraud'
                                            ? 'bg-critical-red/5 border-critical-red/20'
                                            : alert.type === 'risk'
                                                ? 'bg-risk-amber/5 border-risk-amber/20'
                                                : 'bg-white/5 border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-0.5 p-2 rounded-lg ${alert.type === 'fraud' ? 'bg-critical-red/10 text-critical-red' : 'bg-risk-amber/10 text-risk-amber'
                                                }`}>
                                                {alert.type === 'fraud' ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-sm text-white">{alert.title}</h4>
                                                    <span className="text-[9px] font-metrics text-gray-500 uppercase">{alert.timestamp}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed mb-4">{alert.message}</p>
                                                <button className="flex items-center text-[10px] font-bold text-neon-cyan uppercase tracking-widest hover:gap-2 transition-all">
                                                    Mitigate Risk <ChevronRight className="w-3 h-3 ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <ShieldAlert className="w-8 h-8 text-gray-700" />
                                        </div>
                                        <p className="text-gray-500 font-metrics text-[10px] uppercase tracking-widest">No active threats detected</p>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-8 left-8 right-8">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                                    <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <p className="text-[9px] text-gray-600 font-metrics leading-relaxed uppercase tracking-wider">
                                        The system is currently monitoring 12 market vectors. Fraud Shield is operating at 99.8% precision.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
