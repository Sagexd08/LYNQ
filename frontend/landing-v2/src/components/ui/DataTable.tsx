import { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (row: T, index: number) => ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    loading?: boolean;
    emptyMessage?: string;
    compact?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    onRowClick,
    sortKey,
    sortDirection,
    onSort,
    loading,
    emptyMessage = 'No data available',
    compact = false,
}: DataTableProps<T>) {
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    const paddingClasses = compact ? 'px-3 py-2' : 'px-4 py-3';

    if (loading) {
        return (
            <div className="border border-[#1f1f25] rounded bg-[#0d0d0f]">
                <div className="animate-pulse">
                    <div className="h-10 bg-[#111114] border-b border-[#1f1f25]" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 border-b border-[#1a1a1f] last:border-0">
                            <div className="h-4 bg-[#1a1a1f] rounded m-4 w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-[#1f1f25] rounded bg-[#0d0d0f] overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-[#111114] border-b border-[#1f1f25]">
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className={`${paddingClasses} ${alignClasses[col.align || 'left']} text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-gray-300' : ''
                                    }`}
                                style={{ width: col.width }}
                                onClick={() => col.sortable && onSort?.(String(col.key))}
                            >
                                <div className="flex items-center gap-1">
                                    <span>{col.header}</span>
                                    {col.sortable && sortKey === col.key && (
                                        <span className="text-cyan-400">
                                            {sortDirection === 'asc' ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1f]">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-gray-500 text-sm"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`hover:bg-[#111114] transition-colors ${onRowClick ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={`${paddingClasses} ${alignClasses[col.align || 'left']} text-sm font-mono`}
                                    >
                                        {col.render
                                            ? col.render(row, rowIndex)
                                            : String(row[col.key as keyof T] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

interface StatusBadgeProps {
    status: 'active' | 'pending' | 'completed' | 'failed' | 'warning';
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    const styles = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        completed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        failed: 'bg-red-500/10 text-red-400 border-red-500/20',
        warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };

    const labels = {
        active: 'Active',
        pending: 'Pending',
        completed: 'Completed',
        failed: 'Failed',
        warning: 'Warning',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${styles[status]}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {label || labels[status]}
        </span>
    );
}
