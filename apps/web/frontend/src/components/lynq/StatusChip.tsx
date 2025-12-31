import React from 'react';

interface StatusChipProps {
    status: 'active' | 'warning' | 'critical' | 'completed' | 'pending' | 'repaid' | 'defaulted';
    label: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
    const styles: Record<string, string> = {
        active: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]',
        warning: 'bg-risk-amber/10 text-risk-amber border-risk-amber/20',
        critical: 'bg-critical-red/10 text-critical-red border-critical-red/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
        completed: 'bg-white/5 text-gray-400 border-white/10',
        pending: 'bg-premium-violet/10 text-premium-violet border-premium-violet/20',
        repaid: 'bg-white/5 text-gray-400 border-white/10',
        defaulted: 'bg-critical-red/10 text-critical-red border-critical-red/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    };

    return (
        <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-metrics uppercase tracking-wider ${styles[status]}`}>
            {label}
        </div>
    );
};
