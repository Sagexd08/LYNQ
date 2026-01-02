import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
    confidence: number; 
    label?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
    confidence,
    label = 'Confidence',
    showPercentage = true,
    size = 'md',
    animated = true,
}) => {
    const getConfidenceLevel = () => {
        if (confidence >= 80) return { level: 'high', color: 'confidence-high', text: 'High Confidence' };
        if (confidence >= 50) return { level: 'medium', color: 'confidence-medium', text: 'Medium Confidence' };
        return { level: 'low', color: 'confidence-low', text: 'Low Confidence' };
    };

    const { level, color, text } = getConfidenceLevel();

    const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
    const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`${textSizes[size]} text-gray-400 font-medium`}>{label}</span>
                {showPercentage && (
                    <span className={`${textSizes[size]} font-semibold text-${color}`}>
                        {confidence.toFixed(0)}%
                    </span>
                )}
            </div>
            <div className={`confidence-bar ${heights[size]}`}>
                <motion.div
                    className={`${heights[size]} rounded-full ${level === 'high' ? 'confidence-high' : level === 'medium' ? 'confidence-medium' : 'confidence-low'}`}
                    initial={animated ? { width: 0 } : { width: `${confidence}%` }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                />
            </div>
            <p className={`${textSizes[size]} text-gray-500`}>{text}</p>
        </div>
    );
};

interface MLInsightCardProps {
    title: string;
    insight: string;
    confidence: number;
    factors: Array<{ name: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }>;
    recommendation?: string;
    modelAgreement?: number; 
    onExplainClick?: () => void;
}

export const MLInsightCard: React.FC<MLInsightCardProps> = ({
    title,
    insight,
    confidence,
    factors,
    recommendation,
    modelAgreement = 100,
    onExplainClick,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-insight-card"
        >
            {}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                        {title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">AI-Powered Analysis</p>
                </div>
                <button
                    onClick={onExplainClick}
                    className="p-2 rounded-lg bg-glass-white hover:bg-glass-strong transition-colors group"
                    title="Explain this insight"
                >
                    <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                </button>
            </div>

            {}
            <p className="text-white text-base mb-4">{insight}</p>

            {}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <ConfidenceIndicator confidence={confidence} label="Confidence" size="sm" />
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Model Agreement</span>
                        <span className="text-xs font-semibold text-gray-300">{modelAgreement}%</span>
                    </div>
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${i < Math.ceil(modelAgreement / 20)
                                        ? 'bg-neon-cyan'
                                        : 'bg-glass-white'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {}
            <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                    Key Factors
                </p>
                <div className="space-y-2">
                    {factors.slice(0, 4).map((factor, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-lynq-darker/50"
                        >
                            <div className="flex items-center gap-2">
                                {factor.impact === 'positive' && (
                                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                                )}
                                {factor.impact === 'negative' && (
                                    <TrendingDown className="w-3.5 h-3.5 text-error" />
                                )}
                                {factor.impact === 'neutral' && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-gray-500" />
                                )}
                                <span className="text-sm text-gray-300">{factor.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">{(factor.weight * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {}
            {recommendation && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-200">{recommendation}</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

interface RiskAlertProps {
    level: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    onDismiss?: () => void;
    onAction?: () => void;
    actionLabel?: string;
}

export const RiskAlert: React.FC<RiskAlertProps> = ({
    level,
    title,
    message,
    onDismiss,
    onAction,
    actionLabel = 'Take Action',
}) => {
    const levelStyles = {
        low: 'border-risk-low/30 bg-risk-low/5',
        medium: 'border-risk-medium/30 bg-risk-medium/5',
        high: 'border-risk-high/30 bg-risk-high/5 animate-risk-alert',
        critical: 'border-risk-critical/30 bg-risk-critical/5 animate-risk-alert',
    };

    const iconColors = {
        low: 'text-risk-low',
        medium: 'text-risk-medium',
        high: 'text-risk-high',
        critical: 'text-risk-critical',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border ${levelStyles[level]}`}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${iconColors[level]} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <h4 className="font-semibold text-white">{title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{message}</p>
                    {onAction && (
                        <button
                            onClick={onAction}
                            className="mt-3 text-sm font-medium text-neon-cyan hover:text-white transition-colors"
                        >
                            {actionLabel} →
                        </button>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default { ConfidenceIndicator, MLInsightCard, RiskAlert };
