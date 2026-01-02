import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceRingProps {
    value: number; 
    size?: number;
    strokeWidth?: number;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
    value,
    size = 120,
    strokeWidth = 8
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-white/5"
                />
                {}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    className="text-neon-cyan"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))'
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-metrics text-white">{value}%</span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">Confidence</span>
            </div>
        </div>
    );
};
