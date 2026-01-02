import React from 'react';
import { motion } from 'framer-motion';

interface RiskMeterProps {
    level: number; 
    label: string;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ level, label }) => {
    const getStatus = (val: number) => {
        if (val < 30) return { text: 'LOW', color: 'text-neon-cyan', bg: 'bg-neon-cyan' };
        if (val < 60) return { text: 'MODERATE', color: 'text-risk-amber', bg: 'bg-risk-amber' };
        if (val < 85) return { text: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500' };
        return { text: 'CRITICAL', color: 'text-critical-red', bg: 'bg-critical-red' };
    };

    const status = getStatus(level);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-xs font-metrics tracking-widest text-gray-500 uppercase">{label}</span>
                <span className={`text-sm font-bold font-metrics ${status.color}`}>
                    {status.text}
                </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute h-full left-0 top-0 rounded-full ${status.bg} shadow-[0_0_12px_rgba(34,211,238,0.3)]`}
                    style={{
                        background: level > 85 ? 'linear-gradient(90deg, #FACC15, #EF4444)' : undefined
                    }}
                />
                {level > 85 && (
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-red-500/20"
                    />
                )}
            </div>
        </div>
    );
};
