import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: ReactNode;
    variant?: 'default' | 'highlight' | 'warning' | 'danger';
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function MetricCard({
    label,
    value,
    subValue,
    trend,
    trendValue,
    icon,
    variant = 'default',
    onClick,
    size = 'md',
    isLoading = false,
}: MetricCardProps) {
    const variantStyles = {
        default: 'border-[#1f1f25] bg-[#0d0d0f]',
        highlight: 'border-cyan-500/30 bg-cyan-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        danger: 'border-red-500/30 bg-red-500/5',
    };

    const sizeStyles = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
    };

    const valueSizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
    };

    const TrendIcon = {
        up: TrendingUp,
        down: TrendingDown,
        neutral: Minus,
    };

    const trendColors = {
        up: 'text-green-400',
        down: 'text-red-400',
        neutral: 'text-gray-500',
    };

    return (
        <div
            className={`border rounded-lg ${variantStyles[variant]} ${sizeStyles[size]} ${onClick ? 'cursor-pointer hover:border-gray-600 transition-colors' : ''
                } transition-all duration-200`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {label}
                </span>
                {icon && <span className="text-gray-600">{icon}</span>}
            </div>
            {isLoading ? (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <div className="h-6 w-24 bg-[#1a1a1f] rounded animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="flex items-baseline gap-2">
                        <span className={`${valueSizes[size]} font-mono font-semibold text-gray-100`}>
                            {value}
                        </span>
                        {subValue && <span className="text-sm text-gray-500">{subValue}</span>}
                    </div>
                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColors[trend]}`}>
                            {trend && (() => {
                                const IconComponent = TrendIcon[trend];
                                return IconComponent ? <IconComponent className="w-3 h-3" /> : null;
                            })()}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface MetricRowProps {
    children: ReactNode;
    columns?: 2 | 3 | 4 | 5 | 6;
}

export function MetricRow({ children, columns = 4 }: MetricRowProps) {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
    };

    return <div className={`grid ${gridCols[columns]} gap-3`}>{children}</div>;
}
