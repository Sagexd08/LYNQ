import { ReactNode } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

interface SectionProps {
    title: string;
    children: ReactNode;
    action?: ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}

export function Section({ title, children, action }: SectionProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
    return (
        <div
            className={`bg-[#0A0A0A] border border-white/10 rounded-sm p-5 ${hover || onClick ? 'hover:border-white/20 hover:bg-white/5 transition-colors cursor-pointer' : ''
                } ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface PanelProps {
    title: string;
    children: ReactNode;
    headerAction?: ReactNode;
    noPadding?: boolean;
    className?: string;
    isLoading?: boolean;
}

export function Panel({ title, children, headerAction, noPadding, className = '', isLoading = false }: PanelProps) {
    return (
        <div className={`bg-[#0A0A0A] border border-white/10 rounded-sm overflow-hidden ${className}`}>
            <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
                {headerAction}
            </div>
            <div className={noPadding ? '' : 'p-5'}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

interface InlineInspectorProps {
    label: string;
    value: string | number;
    onClick?: () => void;
}

export function InlineInspector({ label, value, onClick }: InlineInspectorProps) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-surface-100/50 border border-white/5 rounded-lg hover:border-primary-500/30 hover:bg-primary-500/5 transition-colors group"
        >
            <span className="text-gray-500">{label}:</span>
            <span className="font-mono text-gray-300 group-hover:text-primary-400">{value}</span>
            <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-primary-400" />
        </button>
    );
}

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#111114] border border-[#1f1f25] flex items-center justify-center mb-4">
                <span className="text-gray-600 text-xl">∅</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
            {description && <p className="text-xs text-gray-600 max-w-sm mb-4">{description}</p>}
            {action}
        </div>
    );
}

interface LoadingSkeletonProps {
    rows?: number;
    type?: 'card' | 'table' | 'metric';
}

export function LoadingSkeleton({ rows = 3, type = 'card' }: LoadingSkeletonProps) {
    if (type === 'metric') {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-[#1a1a1f] rounded w-20 mb-2" />
                <div className="h-8 bg-[#1a1a1f] rounded w-32" />
            </div>
        );
    }

    return (
        <div className="animate-pulse space-y-3">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="h-4 bg-[#1a1a1f] rounded flex-1" />
                    <div className="h-4 bg-[#1a1a1f] rounded w-20" />
                </div>
            ))}
        </div>
    );
}
