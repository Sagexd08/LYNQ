import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, trend }) => {
    return (
        <div className="relative group p-6 rounded-2xl bg-[#0F1115] border border-white/5 hover:border-neon-cyan/20 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-metrics tracking-widest text-gray-500 uppercase">{label}</span>
                {Icon && (
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-neon-cyan/10 transition-colors">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-neon-cyan" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="text-3xl font-bold font-metrics text-white tracking-tight">
                    {value}
                </h3>
                {subValue && (
                    <span className="text-sm font-metrics text-gray-500">{subValue}</span>
                )}
            </div>

            {trend && (
                <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold font-metrics ${trend.isPositive ? 'text-neon-cyan' : 'text-critical-red'}`}>
                    <div className={`w-1 h-1 rounded-full ${trend.isPositive ? 'bg-neon-cyan' : 'bg-critical-red'} animate-pulse`} />
                    {trend.isPositive ? '+' : '-'}{trend.value}%
                    <span className="text-gray-600 font-normal ml-1">vs 24h</span>
                </div>
            )}

            {}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-2xl" />
        </div>
    );
};
