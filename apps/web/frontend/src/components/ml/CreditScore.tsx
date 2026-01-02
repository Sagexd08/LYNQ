import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Star, Shield, Crown, Gem, Award, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';


const TIERS = {
    bronze: {
        name: 'Bronze',
        icon: Shield,
        minScore: 0,
        maxScore: 300,
        color: '#CD7F32',
        gradient: 'from-amber-700 via-amber-600 to-amber-500',
        glowColor: 'rgba(205, 127, 50, 0.4)',
        bgGradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15) 0%, rgba(139, 90, 43, 0.05) 100%)',
    },
    silver: {
        name: 'Silver',
        icon: Award,
        minScore: 301,
        maxScore: 500,
        color: '#C0C0C0',
        gradient: 'from-gray-400 via-gray-300 to-gray-200',
        glowColor: 'rgba(192, 192, 192, 0.4)',
        bgGradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(128, 128, 128, 0.05) 100%)',
    },
    gold: {
        name: 'Gold',
        icon: Star,
        minScore: 501,
        maxScore: 700,
        color: '#FFD700',
        gradient: 'from-yellow-500 via-yellow-400 to-amber-300',
        glowColor: 'rgba(255, 215, 0, 0.5)',
        bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.05) 100%)',
    },
    platinum: {
        name: 'Platinum',
        icon: Crown,
        minScore: 701,
        maxScore: 850,
        color: '#E5E4E2',
        gradient: 'from-slate-300 via-slate-200 to-white',
        glowColor: 'rgba(229, 228, 226, 0.5)',
        bgGradient: 'linear-gradient(135deg, rgba(229, 228, 226, 0.15) 0%, rgba(200, 200, 200, 0.05) 100%)',
    },
    diamond: {
        name: 'Diamond',
        icon: Gem,
        minScore: 851,
        maxScore: 1000,
        color: '#B9F2FF',
        gradient: 'from-cyan-300 via-sky-200 to-blue-200',
        glowColor: 'rgba(185, 242, 255, 0.6)',
        bgGradient: 'linear-gradient(135deg, rgba(185, 242, 255, 0.2) 0%, rgba(0, 229, 255, 0.05) 100%)',
    },
} as const;

type TierKey = keyof typeof TIERS;

interface CreditScoreDisplayProps {
    score: number;
    previousScore?: number;
    tier: TierKey;
    animated?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = ({
    score,
    previousScore,
    tier,
    animated = true,
    size = 'lg',
}) => {
    const tierData = TIERS[tier];
    const TierIcon = tierData.icon;
    const scoreChange = previousScore ? score - previousScore : 0;

    
    const sizeConfig = {
        sm: { ring: 140, stroke: 8, fontSize: '2rem', iconSize: 16 },
        md: { ring: 180, stroke: 10, fontSize: '2.5rem', iconSize: 20 },
        lg: { ring: 240, stroke: 12, fontSize: '3.5rem', iconSize: 24 },
    };

    const config = sizeConfig[size];
    const radius = (config.ring - config.stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(score / 1000, 1);

    
    const springScore = useSpring(0, { stiffness: 50, damping: 20 });
    const displayScore = useTransform(springScore, (val) => Math.round(val));
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        if (animated) {
            springScore.set(score);
            const unsubscribe = displayScore.on('change', (val) => setAnimatedScore(val));
            return () => unsubscribe();
        } else {
            setAnimatedScore(score);
        }
    }, [score, animated, springScore, displayScore]);

    return (
        <div className="relative flex flex-col items-center">
            {}
            <div
                className="relative"
                style={{ width: config.ring, height: config.ring }}
            >
                {}
                <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-60"
                    style={{
                        background: `radial-gradient(circle, ${tierData.glowColor} 0%, transparent 70%)`,
                        transform: 'scale(1.3)',
                    }}
                />

                {}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border: `1px solid ${tierData.color}20`,
                        transform: 'scale(1.15)',
                    }}
                />

                {}
                <svg
                    width={config.ring}
                    height={config.ring}
                    className="relative z-10 transform -rotate-90"
                >
                    {}
                    <circle
                        cx={config.ring / 2}
                        cy={config.ring / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth={config.stroke}
                    />

                    {}
                    <defs>
                        <linearGradient id={`scoreGradient-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={tierData.color} />
                            <stop offset="50%" stopColor={tierData.color} stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#00E5FF" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {}
                    <motion.circle
                        cx={config.ring / 2}
                        cy={config.ring / 2}
                        r={radius}
                        fill="none"
                        stroke={`url(#scoreGradient-${tier})`}
                        strokeWidth={config.stroke}
                        strokeLinecap="round"
                        filter="url(#glow)"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - percentage) }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                            strokeDasharray: circumference,
                        }}
                    />

                    {}
                    <motion.circle
                        cx={config.ring / 2}
                        cy={config.ring / 2}
                        r={radius}
                        fill="none"
                        stroke={tierData.color}
                        strokeWidth={config.stroke + 4}
                        strokeLinecap="round"
                        opacity={0.3}
                        filter="url(#glow)"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - percentage) }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                            strokeDasharray: `${2} ${circumference}`,
                        }}
                    />
                </svg>

                {}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    {}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-center"
                    >
                        <span
                            className="font-bold text-white font-heading tracking-tight"
                            style={{
                                fontSize: config.fontSize,
                                textShadow: `0 0 40px ${tierData.glowColor}`,
                            }}
                        >
                            {animatedScore}
                        </span>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">LYNQ Score</p>
                    </motion.div>
                </div>
            </div>

            {}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6"
            >
                <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-sm"
                    style={{
                        background: tierData.bgGradient,
                        borderColor: `${tierData.color}40`,
                        boxShadow: `0 0 20px ${tierData.glowColor}`,
                    }}
                >
                    <TierIcon
                        className="w-5 h-5"
                        style={{ color: tierData.color }}
                    />
                    <span
                        className="font-semibold text-sm tracking-wide"
                        style={{ color: tierData.color }}
                    >
                        {tierData.name} Tier
                    </span>
                </div>
            </motion.div>

            {}
            {scoreChange !== 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className={`mt-4 flex items-center gap-2 text-sm font-medium ${scoreChange > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                >
                    {scoreChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                        {scoreChange > 0 ? '+' : ''}{scoreChange} from last month
                    </span>
                </motion.div>
            )}
        </div>
    );
};


interface TierProgressProps {
    currentTier: TierKey;
    currentScore: number;
}

export const TierProgress: React.FC<TierProgressProps> = ({
    currentTier,
    currentScore,
}) => {
    const tierOrder: TierKey[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentTierIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentTierIndex < 4 ? tierOrder[currentTierIndex + 1] : null;
    const nextTierData = nextTier ? TIERS[nextTier] : null;
    const currentTierData = TIERS[currentTier];

    
    const pointsToNext = nextTierData ? nextTierData.minScore - currentScore : 0;
    const tierRange = nextTierData
        ? nextTierData.minScore - currentTierData.minScore
        : 1;
    const progressInTier = nextTierData
        ? ((currentScore - currentTierData.minScore) / tierRange) * 100
        : 100;

    return (
        <div className="w-full space-y-4">
            {}
            <div className="relative">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressInTier}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                        className="h-full rounded-full relative"
                        style={{
                            background: `linear-gradient(90deg, ${currentTierData.color}, ${nextTierData?.color || currentTierData.color})`,
                            boxShadow: `0 0 10px ${currentTierData.glowColor}`,
                        }}
                    />
                </div>
            </div>

            {}
            <div className="flex justify-between items-center px-2">
                {tierOrder.map((tierKey, index) => {
                    const tier = TIERS[tierKey];
                    const TierIcon = tier.icon;
                    const isActive = index <= currentTierIndex;
                    const isCurrent = tierKey === currentTier;

                    return (
                        <div key={tierKey} className="flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className={`
                  relative w-10 h-10 rounded-xl flex items-center justify-center
                  transition-all duration-300
                  ${isCurrent
                                        ? 'scale-110'
                                        : isActive
                                            ? 'opacity-100'
                                            : 'opacity-40'
                                    }
                `}
                                style={{
                                    background: isActive ? tier.bgGradient : 'rgba(255,255,255,0.05)',
                                    border: isCurrent ? `2px solid ${tier.color}` : '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: isCurrent ? `0 0 15px ${tier.glowColor}` : 'none',
                                }}
                            >
                                <TierIcon
                                    className="w-5 h-5"
                                    style={{ color: isActive ? tier.color : 'rgba(255,255,255,0.3)' }}
                                />
                                {isCurrent && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                                        style={{ backgroundColor: tier.color }}
                                    />
                                )}
                            </motion.div>
                            <span
                                className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}
                            >
                                {tier.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {}
            {nextTier && pointsToNext > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <Sparkles className="w-4 h-4 text-neon-cyan" />
                        <span className="text-sm text-gray-300">
                            <span className="font-bold text-white">{pointsToNext}</span> points to {TIERS[nextTier].name}
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
