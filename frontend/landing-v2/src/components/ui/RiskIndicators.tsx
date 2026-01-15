interface RiskBarProps {
    value: number;
    max?: number;
    showValue?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export function RiskBar({ value, max = 100, showValue = true, size = 'md', label }: RiskBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    const getColor = (pct: number) => {
        if (pct <= 30) return 'bg-green-500';
        if (pct <= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const heights = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{label}</span>
                    {showValue && (
                        <span className="text-xs font-mono text-gray-400">{value.toFixed(1)}%</span>
                    )}
                </div>
            )}
            <div className={`w-full bg-[#1a1a1f] rounded-full overflow-hidden ${heights[size]}`}>
                <div
                    className={`${heights[size]} ${getColor(percentage)} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

interface ConfidenceMeterProps {
    value: number;
    label?: string;
}

export function ConfidenceMeter({ value, label }: ConfidenceMeterProps) {
    const getColor = (val: number) => {
        if (val >= 0.8) return { ring: 'stroke-green-500', text: 'text-green-400' };
        if (val >= 0.6) return { ring: 'stroke-cyan-500', text: 'text-cyan-400' };
        if (val >= 0.4) return { ring: 'stroke-amber-500', text: 'text-amber-400' };
        return { ring: 'stroke-red-500', text: 'text-red-400' };
    };

    const colors = getColor(value);
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - value * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="36"
                        fill="none"
                        stroke="#1a1a1f"
                        strokeWidth="6"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="36"
                        fill="none"
                        className={colors.ring}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-mono font-bold ${colors.text}`}>
                        {(value * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
            {label && <span className="mt-2 text-xs text-gray-500 uppercase tracking-wider">{label}</span>}
        </div>
    );
}

interface TierBadgeProps {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
    const colors = {
        bronze: 'from-orange-700 to-orange-500 border-orange-500/30',
        silver: 'from-gray-400 to-gray-300 border-gray-400/30',
        gold: 'from-amber-500 to-yellow-400 border-amber-400/30',
        platinum: 'from-cyan-400 to-cyan-200 border-cyan-400/30',
        diamond: 'from-purple-400 to-pink-300 border-purple-400/30',
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    return (
        <span
            className={`inline-flex items-center font-semibold rounded border bg-gradient-to-r ${colors[tier]} ${sizes[size]} text-white uppercase tracking-wider`}
        >
            {tier}
        </span>
    );
}

interface ScoreDisplayProps {
    score: number;
    maxScore?: number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ score, maxScore = 1000, label, size = 'md' }: ScoreDisplayProps) {
    const percentage = (score / maxScore) * 100;

    const getGrade = () => {
        if (percentage >= 90) return { grade: 'A+', color: 'text-green-400' };
        if (percentage >= 80) return { grade: 'A', color: 'text-green-400' };
        if (percentage >= 70) return { grade: 'B', color: 'text-cyan-400' };
        if (percentage >= 60) return { grade: 'C', color: 'text-amber-400' };
        if (percentage >= 50) return { grade: 'D', color: 'text-orange-400' };
        return { grade: 'F', color: 'text-red-400' };
    };

    const { grade, color } = getGrade();

    const sizes = {
        sm: { score: 'text-2xl', label: 'text-xs' },
        md: { score: 'text-4xl', label: 'text-sm' },
        lg: { score: 'text-5xl', label: 'text-base' },
    };

    return (
        <div className="flex items-center gap-4">
            <div className="text-center">
                <div className={`${sizes[size].score} font-mono font-bold ${color}`}>{score}</div>
                {label && <div className={`${sizes[size].label} text-gray-500 mt-1`}>{label}</div>}
            </div>
            <div className={`${sizes[size].score} font-bold ${color} opacity-50`}>{grade}</div>
        </div>
    );
}
