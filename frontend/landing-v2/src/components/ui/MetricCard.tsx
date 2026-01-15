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
        default: 'border-white/5 bg-surface-50/50 backdrop-blur-sm hover:border-white/10',
        highlight: 'border-primary-500/30 bg-primary-500/5 backdrop-blur-sm',
        warning: 'border-amber-500/30 bg-amber-500/5 backdrop-blur-sm',
        danger: 'border-red-500/30 bg-red-500/5 backdrop-blur-sm',
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
        up: 'text-emerald-400',
        down: 'text-rose-400',
        neutral: 'text-gray-500',
    };

    return (
        <div
            className={`border rounded-xl ${variantStyles[variant]} ${sizeStyles[size]} ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-surface-100/50 transition-colors' : ''
                } transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary-500/5`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {label}
                </span>
                {icon && <span className="text-gray-500">{icon}</span>}
            </div>
            {isLoading ? (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                    <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="flex items-baseline gap-2">
                        <span className={`${valueSizes[size]} font-mono font-semibold text-gray-100 tracking-tight`}>
                            {value}
                        </span>
                        {subValue && <span className="text-sm text-gray-500">{subValue}</span>}
                    </div>
                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColors[trend]}`}>
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
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6',
    };

    return <div className={`grid ${gridCols[columns]} gap-4`}>{children}</div>;
}
